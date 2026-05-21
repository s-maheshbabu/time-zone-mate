# CLAUDE.md — Time Zone Mate

## Project overview
React 18 + Vite + Tailwind world-clock app at timezonemate.com. Users add clocks for cities/countries/timezones, can pause/edit times, and all clocks sync to the same UTC instant.

## Commands
```bash
npm install       # install deps
npm run dev       # dev server → http://localhost:5173
npm run build     # production build → build/
npm run preview   # serve build/ locally
```

## Source layout
```
src-react/          # Vite root (configured in vite.config.js)
  App.jsx           # top-level state wiring
  hooks/useClocks.js     # all clock state logic (single source of truth)
  components/
    ClockRow.jsx         # single clock UI + free-form time parser
    ClockList.jsx        # 2-column grid of added clocks
    AddClockPanel.jsx    # collapsible add-clock panel
    TimeZoneSearch.jsx   # autocomplete search input
    Navbar.jsx
    Footer.jsx
  data/
    timeZoneData.js      # location→tz lookup tables + public API
    podunksToTimeZones.json   # secondary "include all locations" dataset
build/              # Vite output (committed; served by Amplify)
infrastructure/     # AWS CDK (TypeScript) — Amplify + Route 53
scripts/release.sh  # merges master → release-prod and pushes
```

## Key architecture notes

**Clock state** lives entirely in `useClocks.js`. Each clock is an object `{ id, title, type ('named'|'offset'), timeZoneName, offsetMinutes, dt (Luxon DateTime), invalidTime, editMode }`. The local clock is always index 0; added clocks are indices 1+.

**Time sync**: editing any clock calls `adjustAllClocks(pivotIndex)` which converts the pivot to UTC then re-applies each clock's zone — all clocks share the same instant.

**Location lookup** (`timeZoneData.js`) has four lookup tables merged at module init:
- `countriesToTimeZones` — country name → IANA tz
- `majorUrbanAreasToTimeZones` — city → IANA tz (**contains known bad mappings**, see comment in file)
- `timeZonesToTimeZones` — IANA tz IDs (self-mapped, loaded only when "Include all locations" is on)
- `abbreviationToTimeZones` + `offsetsToOffsets` — abbreviations and GMT±N strings → offset minutes

"Include all locations" lazy-loads `podunksToTimeZones.json` and appends it. `purgePeripheralLocations()` resets to the core set.

**Data quality issue**: `majorUrbanAreasToTimeZones` has many incorrect mappings inherited from the original codebase (e.g. Lagos→Europe/Lisbon, Moscow→America/Los_Angeles, Paris→America/Chicago, Sydney→America/Glace_Bay). These need auditing before touching city data.

## UI conventions
- Brand colors: `#00c6ff` (buttons), `#46d633` (clock title labels, calendar button)
- Clock titles rendered green (`style={{ color: '#46d633' }}`) in `ClockRow.jsx`
- Free-form time input parses strings like `3p`, `3:23a`, `15:30`, `930pm` via `parseTimeString()` in `ClockRow.jsx`

## No test suite
There are no automated tests. Verify changes manually with `npm run dev`.

## Branch / deploy
| Branch | Environment | URL |
|---|---|---|
| `master` | Devo | devo.timezonemate.com |
| `release-prod` | Prod | timezonemate.com |

Run `./scripts/release.sh` to merge master → release-prod and trigger prod deploy.
