# Architecture & Design

## System Overview

A Node.js (TypeScript) microservice that runs as a long-lived Docker container. It uses an internal cron scheduler to trigger monthly timesheet generation, with recovery logic for missed executions.

## High-Level Flow

```
Service starts
    │
    ▼
Load config (.env)
    │
    ▼
Recovery check ──────────────────┐
    │                            │
    │  lastProcessedMonth        │  currentMonth > lastProcessed?
    │  == currentMonth?          │  YES → run workflow for each
    │  YES → skip                │        missed month
    │                            │
    ▼                            ▼
Start cron scheduler    ◄────────┘
    │
    │  (waits until 1st of month, 9 AM)
    │
    ▼
Execute workflow
    │
    ├─ 1. Check state (skip if already processed)
    ├─ 2. Load timesheet-data.json
    ├─ 3. Fetch holidays (cache or API)
    ├─ 4. Build calendar model
    ├─ 5. Calculate leave balances
    ├─ 6. Generate Excel from template
    ├─ 7. Send email (AWS SES)
    └─ 8. Update execution state
```

## Module Responsibilities

| Module | Purpose | I/O |
|--------|---------|-----|
| `index.ts` | Entry point, recovery, scheduler init | Process args, env |
| `config.ts` | Validate env vars | Reads `process.env` |
| `logger.ts` | Structured console logging | Console output |
| `scheduler.ts` | Cron job setup | Timer |
| `workflow.ts` | Orchestrates all steps | Calls all other modules |
| `calendar.ts` | Build month model (pure) | None — pure function |
| `holidays.ts` | Fetch/cache SG holidays | Network + filesystem |
| `timesheet.ts` | Excel manipulation | Reads template, writes output |
| `email.ts` | Send email via SMTP | Network |
| `state.ts` | Track processed months | Filesystem (JSON) |
| `template-map.ts` | Cell position constants | None — constants only |
| `types.ts` | TypeScript interfaces | None — types only |

## Data Flow

```
timesheet-data.json ──┐
                      │
.env (config) ────────┤
                      ▼
holidays API ──► workflow.ts ──► timesheet.ts ──► output/timesheet-YYYY-MM.xlsx
   │                                │
   ▼                                ▼
holidays-cache/              email.ts ──► AWS SES ──► recipient
                                │
                                ▼
                        execution-state.json
```

## State Machine

```
          ┌───────────┐
          │   IDLE    │
          └─────┬─────┘
                │ cron trigger / recovery / --run-now
                ▼
        ┌───────────────┐
        │  CHECK STATE  │──── already processed ──► IDLE
        └───────┬───────┘
                │ not processed
                ▼
        ┌───────────────┐
        │  PROCESSING   │
        │               │
        │  holidays     │
        │  calendar     │
        │  timesheet    │
        │  email        │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ UPDATE STATE  │
        └───────┬───────┘
                │
                ▼
          ┌───────────┐
          │   IDLE    │
          └───────────┘
```

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language | TypeScript + ESM | Type safety, IDE support, modern patterns |
| Runtime | Node.js 23 | User's installed version, ESM native |
| Excel lib | ExcelJS | Preserves images, merged cells, styles |
| Scheduler | node-cron (in-process) | Simple, no external dependency |
| Container | Long-running Docker | `restart: unless-stopped` auto-recovers |
| State | JSON file | Simple, human-readable, no DB needed |
| Email | nodemailer + SES SMTP | User-selected, reliable |
| Holidays | Calendarific API | Free tier, SG support |
| Testing | Vitest | ESM-native, fast, zero-config |
| Dev runner | tsx + nodemon | Hot reload without compile step |
