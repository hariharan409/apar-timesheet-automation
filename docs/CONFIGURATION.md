# Configuration Guide

## Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

### Required Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `SMTP_HOST` | `email-smtp.ap-southeast-1.amazonaws.com` | AWS SES SMTP endpoint for your region |
| `SMTP_PORT` | `587` | Use 587 (STARTTLS) or 465 (SSL) |
| `SMTP_USER` | `AKIA...` | SES SMTP username (not IAM access key) |
| `SMTP_PASS` | `BDz7...` | SES SMTP password (not IAM secret key) |
| `EMAIL_FROM` | `you@example.com` | Must be verified in SES |
| `EMAIL_TO` | `recipient@example.com` | Recipient email address |
| `CALENDARIFIC_API_KEY` | `abc123...` | Get from [calendarific.com](https://calendarific.com/signup) |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TZ` | `Asia/Singapore` | Timezone for scheduling |
| `CRON_SCHEDULE` | `0 9 1 * *` | Cron expression (default: 9 AM on 1st) |
| `LOG_LEVEL` | `info` | `error`, `warn`, `info`, or `debug` |

## Timesheet Data (`data/timesheet-data.json`)

This is the file you edit before each month.

### Schema

```json
{
  "employee": {
    "name": "Your full name",
    "client": "Client name and location"
  },
  "annual-leave-allocation": 6,
  "medical-leave-allocation": 6,
  "work-mode": "wfh",
  "months": {
    "YYYY-MM": {
      "annual-leave-dates": ["YYYY-MM-DD", "..."],
      "medical-leave-dates": ["YYYY-MM-DD", "..."],
      "comp-off": 0
    }
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `employee.name` | string | Your full name (appears on timesheet) |
| `employee.client` | string | Client/location info |
| `annual-leave-allocation` | number | Total AL days for the year |
| `medical-leave-allocation` | number | Total ML days for the year |
| `work-mode` | `"wfh"` or `"wfo"` | Determines which row gets hours |
| `months.YYYY-MM.annual-leave-dates` | string[] | Specific dates of annual leave |
| `months.YYYY-MM.medical-leave-dates` | string[] | Specific dates of medical leave |
| `months.YYYY-MM.comp-off` | number | Comp-off days (manual entry) |

### How to Add Leave Data

Before the 1st of each month, add an entry for the upcoming month:

```json
{
  "months": {
    "2026-04": {
      "annual-leave-dates": ["2026-04-15", "2026-04-16"],
      "medical-leave-dates": [],
      "comp-off": 0
    }
  }
}
```

**Important:** Use the format `YYYY-MM-DD` for all dates. Leave dates must be weekdays — putting a weekend date won't cause an error but it's redundant (weekends are already non-working).

### Leave Balances

Leave balances are calculated **automatically** from all months in the file. You don't need to manually track remaining days — the system accumulates all prior months' leave dates and subtracts from your allocation.

## Execution State (`data/execution-state.json`)

Tracks the last processed month. You normally don't need to edit this.

```json
{
  "lastProcessedMonth": "2026-03",
  "lastExecutionTimestamp": "2026-03-01T09:00:00.000Z"
}
```

To force re-processing of a month, set `lastProcessedMonth` to the month before the one you want to regenerate.
