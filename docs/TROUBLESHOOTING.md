# Troubleshooting

## Container Issues

### Container won't start
- Check env vars: `docker-compose config` — verify no missing values
- Check logs: `docker-compose logs`
- Verify `.env` file exists and has all required variables

### Container keeps restarting
- Check for fatal errors: `docker-compose logs --tail 50`
- Common cause: missing env vars → service exits with error

### Recovery not triggering after reboot
- Verify `restart: unless-stopped` in `docker-compose.yml`
- Check `data/execution-state.json` — `lastProcessedMonth` should be behind current month
- Run manually: `docker-compose exec timesheet-automation node dist/index.js --run-now`

## Email Issues

### Email not sending
- Verify SES credentials are SMTP credentials (not IAM keys)
- Check SES sending limits and verified domains/emails
- Check if your SES account is still in sandbox mode (sandbox only allows verified emails)
- Test connection: try sending a test email with the same SMTP credentials using another tool

### Email goes to spam
- Verify SPF/DKIM records for your sending domain in SES
- Check subject line for spam triggers

## Holiday API Issues

### "Failed to fetch holidays"
- Verify `CALENDARIFIC_API_KEY` is correct
- Check if free tier API limit is reached (500 requests/month)
- The system will use cached data if available, or proceed without holidays

### Wrong holidays showing
- Check `data/holidays-cache/{year}.json` — delete it to force a fresh fetch
- The API returns Singapore national holidays only (`type=national`)

## Timesheet Issues

### Wrong dates or day names
- Verify timezone: `TZ` env var should be `Asia/Singapore`
- Run `npm run inspect-template` to verify cell positions match template

### Hours appearing on wrong row
- Check `work-mode` in `data/timesheet-data.json` — should be `"wfh"` or `"wfo"`

### Leave not reflected
- Ensure dates are in `YYYY-MM-DD` format in `data/timesheet-data.json`
- Ensure the month entry exists (e.g., `"2026-04": { ... }`)
- Leave dates must fall within the target month

### Template images missing in output
- ExcelJS should preserve images. If not, verify ExcelJS version: `npm ls exceljs`
- Try with a simpler template to isolate the issue

### Wrong working days count
- Cross-check with calendar: count weekdays minus holidays minus leaves
- Run tests: `npm test` — the calendar module is well-tested

## Manual Override

### Re-generate a specific month
```bash
# Set state to the month before
# Edit data/execution-state.json: { "lastProcessedMonth": "2026-02" }
# Then run for the target month:
npm run run-now -- 2026-03
```

### Force regeneration even if already processed
Edit `data/execution-state.json` and set `lastProcessedMonth` to the month before the one you want to regenerate.
