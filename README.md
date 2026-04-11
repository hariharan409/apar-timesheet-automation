# Apar Timesheet Automation

Monthly timesheet generation and email automation for Apar Technologies. Runs as a Docker container on your local machine — generates an Excel timesheet on the 1st of every month, fills in dates/hours/leave/holidays, and emails it via AWS SES.

## Quick Start

### Prerequisites

- **Node.js** >= 23.0.0
- **Docker** & Docker Compose (for containerized deployment)
- **AWS SES** SMTP credentials
- **Calendarific** API key ([free signup](https://calendarific.com/signup))

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy your timesheet template
cp /path/to/your-template.xlsx templates/timesheet-template.xlsx

# 3. Create .env from example
cp .env.example .env
# Edit .env with your credentials

# 4. Update leave data
# Edit data/timesheet-data.json with your info
```

### Run

```bash
# Development (auto-restart on file changes)
npm run dev

# Manual trigger (generate current month immediately)
npm run run-now

# Production
npm start

# Inspect template cell positions
npm run inspect-template

# Run tests
npm test
```

### Docker Deployment

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

The container uses `restart: unless-stopped` — it auto-starts after machine reboot and recovers any missed months.

## Monthly Workflow

Before each month's 1st:

1. Edit `data/timesheet-data.json` — add the upcoming month's leave dates
2. That's it. The service handles the rest automatically.

If you forget to update leave data, the timesheet will generate with zero leaves. You can update the data and re-run manually.

## Project Structure

```
src/
  index.ts              — entry point: recovery + scheduler
  workflow.ts            — orchestrator (generate → convert → email → state)
  config/
    config.ts            — env var loading
    types.ts             — TypeScript interfaces
  core/
    logger.ts            — structured logging
    state.ts             — atomic JSON state
    scheduler.ts         — cron setup
  calendar/
    calendar.ts          — pure: month model builder
    holidays.ts          — Calendarific API + cache
  timesheet/
    timesheet.ts         — Excel template manipulation
    template-map.ts      — cell position constants
    pdf.ts               — optional xlsx → PDF (auto-detects LibreOffice)
  email/
    email.ts             — AWS SES SMTP
  utils/
    template-inspector.ts — utility to verify cell positions
data/
  timesheet-data.json    — leave + employee info (you edit this)
  execution-state.json   — tracks last processed month
  holidays-cache/        — cached holiday data per year
templates/
  timesheet-template.xlsx — your original template (never modified)
output/
  timesheet-YYYY-MM.{xlsx,pdf} — generated timesheets
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | Yes | — | AWS SES SMTP endpoint |
| `SMTP_PORT` | Yes | — | SMTP port (587 or 465) |
| `SMTP_USER` | Yes | — | SES SMTP username |
| `SMTP_PASS` | Yes | — | SES SMTP password |
| `EMAIL_FROM` | Yes | — | Sender email address |
| `EMAIL_TO` | Yes | — | Recipient email address |
| `CALENDARIFIC_API_KEY` | Yes | — | Calendarific API key |
| `TZ` | No | `Asia/Singapore` | Timezone |
| `CRON_SCHEDULE` | No | `0 9 1 * *` | Cron expression |
| `LOG_LEVEL` | No | `info` | Log level (error/warn/info/debug) |

## Documentation

- [Architecture & Design](docs/architecture.md)
- [Configuration Guide](docs/configuration.md)
- [Template Mapping](docs/template-mapping.md)
- [Troubleshooting](docs/troubleshooting.md)
