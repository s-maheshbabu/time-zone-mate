# Time Zone Mate

A world clock and timezone conversion web app at [timezonemate.com](https://timezonemate.com).

## Tech Stack

- **Frontend:** AngularJS 1.3, jQuery, Moment.js, Bootstrap
- **Build:** Grunt (LESS compilation, JS/CSS minification)
- **Hosting:** AWS Amplify
- **Infrastructure:** AWS CDK (TypeScript)
- **Domain:** AWS Route 53

## Local Development

**Prerequisites:** Node.js, npm

```bash
npm install
npm install -g grunt-cli
grunt          # builds, watches for changes, and starts a local server at http://localhost:7337
```

Build output goes to `deploy/static/`.

## Branch Strategy

| Branch         | Environment | URL                        | Purpose                        |
|----------------|-------------|----------------------------|--------------------------------|
| `master`       | Devo        | devo.timezonemate.com      | Default branch, active development |
| `release-prod` | Prod        | timezonemate.com           | Stable production releases     |

**Workflow:**
1. Do all development on `master` — auto-deploys to `devo.timezonemate.com` on every push
2. When ready to release, run the release script from the repo root:

```bash
./scripts/release.sh
```

This merges `master` into `release-prod`, pushes (triggering the Amplify prod build), and switches you back to `master`.

## Hosting Infrastructure (AWS Amplify)

The site is hosted on AWS Amplify with automatic CI/CD — every push to a tracked branch triggers a build and deploy.

**Build process** (defined in `amplify.yml` at repo root):
1. `npm ci` — installs dependencies
2. `npx grunt build` — compiles LESS, minifies JS/CSS
3. `npx grunt prepare_deploy` — copies build output to `deploy/static/`
4. Amplify serves from `deploy/static/`

**GitHub connection:** The Amplify app is connected to GitHub via the AWS Amplify GitHub App (authorized once via the Amplify Console — no tokens stored).

## Infrastructure as Code

All AWS infrastructure is defined in `infrastructure/` using AWS CDK (TypeScript).

```
infrastructure/
├── bin/app.ts                    # CDK entry point
├── lib/
│   ├── time-zone-mate-stack.ts   # Amplify app, branches, domain, IAM role
│   └── infrastructure-config.ts # Typed config loader
├── infrastructure-config.json    # AWS account, region, branch names, domain
├── cdk.json
├── package.json
└── tsconfig.json
```

**Resources created by CDK:**
- `AWS::Amplify::App` — the Amplify app with SPA redirect rules
- `AWS::Amplify::Branch` — one for `master` (devo) and one for `release-prod` (prod)
- `AWS::Amplify::Domain` — maps `timezonemate.com` and `www` to prod, `devo.timezonemate.com` to devo
- `AWS::IAM::Role` — Amplify service role with `AdministratorAccess-Amplify` policy

### CDK Commands

```bash
cd infrastructure
npm install

npx cdk diff      # preview changes before deploying
npx cdk deploy    # deploy infrastructure changes
npx cdk synth     # synthesize CloudFormation template (dry run / validation)
```

### First-time CDK Setup

```bash
# Bootstrap CDK in your AWS account/region (one-time per account+region)
npx cdk bootstrap aws://837603326872/us-east-1
```

### Updating Infrastructure Config

Edit `infrastructure/infrastructure-config.json` to change branches, domain, account, or region, then run `npx cdk deploy`.
