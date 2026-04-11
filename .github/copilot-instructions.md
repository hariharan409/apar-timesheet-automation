# Copilot Instructions — apar-timesheet-automation

## Project Overview

Monthly timesheet automation microservice. Runs on the 1st of every month (or catches up on missed months), generates an Excel timesheet from a template, fills attendance/holidays/leave data, and emails the result via AWS SES.

## Tech Stack

- **Runtime**: Node.js 23, TypeScript 5, ESM (`"type": "module"`)
- **Build**: `tsc` for production (`tsconfig.build.json`), `tsx` for dev
- **Excel**: ExcelJS (read/write .xlsx preserving styles, images, merged cells)
- **Scheduling**: node-cron (in-process)
- **Email**: nodemailer + AWS SES SMTP
- **Holidays**: Calendarific API (cached per year)
- **Dates**: date-fns
- **Testing**: Vitest
- **Linting**: ESLint 8 + @typescript-eslint + eslint-config-prettier + eslint-plugin-import
- **Formatting**: Prettier (single quotes, 100 print width, trailing commas)
- **Git hooks**: Husky 9 + lint-staged (pre-commit: eslint --fix + prettier --write)
- **Deployment**: Docker (node:23-alpine, multi-stage build)

## npm Scripts — Always Use These

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server with nodemon + tsx |
| `npm run build` | Compile TypeScript to `dist/` |0
| `npm start` | Run compiled production build |
| `npm run run-now` | Trigger immediate timesheet generation |
| `npm test` | Run Vitest tests |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | Check for ESLint errors |
| `npm run lint:fix` | Auto-fix ESLint errors |
| `npm run format` | Format all .ts files with Prettier |
| `npm run format:check` | Check formatting without writing |
| `npm run type-check` | Run `tsc --noEmit` for type validation |
| `npm run inspect-template` | Inspect Excel template cell positions |

**Never run `npx eslint`, `npx prettier`, `npx tsc`, or `npx vitest` directly — always use the npm scripts above.**

## Code Style

- **Arrow functions only** — use `const fn = () => {}` not `function fn() {}` (enforced by `func-style: "expression"`)
- **Imports**: grouped and alphabetically ordered (enforced by eslint-plugin-import)
- **No `console.log`** in source — use the structured logger (`createLogger()`)
- **No `any`** — strict TypeScript throughout
- **Prefer `??` and `?.`** over manual null checks
- **Use `.at()` for array access** when the result could be undefined (e.g., `worksheets.at(0)`)

## Project Structure

```
src/
  index.ts          # Entry point — loads config, recovery check, starts scheduler
  workflow.ts       # Orchestrator — state → data → holidays → generate → convert → email
  config/
    config.ts       # Environment variable loading and validation
    types.ts        # Central TypeScript interfaces
  core/
    logger.ts       # Structured logging [timestamp] [LEVEL] [module]
    state.ts        # Atomic JSON read/write for execution state tracking
    scheduler.ts    # node-cron wrapper
  calendar/
    calendar.ts     # Pure function — builds month model with day breakdown
    holidays.ts     # Calendarific API fetch + yearly JSON cache
  timesheet/
    timesheet.ts    # ExcelJS template manipulation
    template-map.ts # Excel cell position constants (rows/columns)
    pdf.ts          # LibreOffice headless xlsx → pdf conversion
  email/
    email.ts        # nodemailer + AWS SES SMTP email sending
  utils/
    template-inspector.ts  # Dev utility to inspect template cell values
tests/
  calendar.test.ts
  timesheet.test.ts
data/               # Runtime data (JSON config, state, holiday cache)
templates/          # Excel template file
output/             # Generated timesheet files
docs/               # Architecture, configuration, template mapping, troubleshooting
```

## tsconfig Split

- `tsconfig.json` — Base config for type-checking, ESLint, and IDE (includes `src/`, `tests/`, `vitest.config.ts`)
- `tsconfig.build.json` — Extends base, adds `rootDir: src`, `outDir: dist`, excludes tests (used by `npm run build`)

## Key Patterns

- **Template map** (`src/template-map.ts`): Single source of truth for all Excel cell positions. Always reference `ROWS.*` and `COLS.*` constants instead of hardcoding row/column numbers.
- **State management** (`src/state.ts`): Tracks last processed month to support catch-up after downtime. Uses atomic write (temp file → rename).
- **Holiday caching** (`src/holidays.ts`): Fetches from Calendarific API once per year, caches to `data/holidays-cache/`.
- **Workflow** (`src/workflow.ts`): Orchestrates the full pipeline. Handles missed months by looping from last processed to current.

## Quality Gates

All code must pass these checks before merging:

1. **Pre-commit hook** (Husky + lint-staged): runs `eslint --fix` + `prettier --write` on staged `.ts` files automatically
2. **Pre-push hook** (Husky): runs the full quality pipeline before any push
   - `npm run lint` — ESLint check
   - `npm run format:check` — Prettier check (no writes)
   - `npm run type-check` — TypeScript `tsc --noEmit`
   - `npm test` — Vitest
   - `npm run build` — Production build
