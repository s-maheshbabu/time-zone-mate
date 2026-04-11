import { useRef, useState } from 'react'

// Parses flexible time strings like "3p", "3:23a", "3 23 am", "15:30", "930pm", etc.
// Returns "HH:mm:ss" on success, null on failure.
function parseTimeString(raw) {
  if (!raw) return null
  const s = raw.trim().toLowerCase()
  // Groups: (hour) [sep] (minute)? [sep] (second)? (meridiem)?
  const m = s.match(/^(\d{1,2})[\s:]?(\d{2})?[\s:]?(\d{2})?\s*(am?|pm?)?$/)
  if (!m) return null
  let h = parseInt(m[1], 10)
  const min = m[2] !== undefined ? parseInt(m[2], 10) : 0
  const sec = m[3] !== undefined ? parseInt(m[3], 10) : 0
  const mer = m[4]
  if (min > 59 || sec > 59) return null
  if (mer) {
    if (h > 12) return null
    if (mer.startsWith('p') && h !== 12) h += 12
    if (mer.startsWith('a') && h === 12) h = 0
  }
  if (h > 23) return null
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// Displays a single clock: time input, calendar button, full datetime label.
// Used for both the local clock and added clocks.
export default function ClockRow({ clock, onTimeChange, onDateChange, onCalendarClick, children }) {
  const dateInputRef = useRef(null)
  const inputRef = useRef(null)
  const [editValue, setEditValue] = useState(null) // null = not editing

  const formattedTime = clock.invalidTime ? '' : clock.dt.toFormat('hh:mm:ss a')
  const dateValue = clock.dt.toISODate()
  const fullDisplay = clock.dt.toFormat("EEE MMM dd yyyy HH:mm:ss 'GMT'ZZ")
  const isEditing = editValue !== null

  function handleFocus() {
    setEditValue(formattedTime)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function handleChange(e) {
    const raw = e.target.value
    setEditValue(raw)
    const parsed = parseTimeString(raw)
    if (parsed) onTimeChange(parsed)
  }

  function handleBlur() {
    if (!parseTimeString(editValue)) onTimeChange(null)
    setEditValue(null)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') e.target.blur()
  }

  function handleCalendarClick() {
    onCalendarClick?.()
    try { dateInputRef.current?.showPicker() } catch (_) {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="font-bold" style={{ color: '#46d633' }}>{clock.title}</label>
        {children}
      </div>

      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={isEditing ? editValue : formattedTime}
          placeholder="e.g. 3pm, 3:30a, 15:45"
          onFocus={handleFocus}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`flex-1 px-3 py-2 font-bold border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00c6ff] ${
            clock.invalidTime ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <button
          type="button"
          onClick={handleCalendarClick}
          className="px-3 py-2 rounded-md text-white text-sm"
          style={{ backgroundColor: '#46d633' }}
          title="Pick date"
        >
          &#128197;
        </button>
        {/* Hidden date input — triggered programmatically via showPicker(). */}
        <input
          ref={dateInputRef}
          type="date"
          value={dateValue}
          onChange={e => onDateChange(e.target.value)}
          className="absolute opacity-0 w-px h-px pointer-events-none"
          tabIndex={-1}
        />
      </div>

      <div className="mt-1 min-h-[1.25rem]">
        {clock.invalidTime ? (
          <span className="text-xs text-white bg-red-500 px-2 py-0.5 rounded">Invalid Time</span>
        ) : (
          <span className="text-sm text-gray-500">{fullDisplay}</span>
        )}
      </div>
    </div>
  )
}
