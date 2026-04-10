# Template Mapping

This document describes which cells in the Excel template the code writes to. If the template layout changes, update `src/template-map.ts` accordingly.

## Cell Reference Grid

Run `npm run inspect-template` to verify these positions against your actual template.

## Row-by-Row Mapping

| Row | Col(s) | Content | Source |
|-----|--------|---------|--------|
| 2 | A | "APAR TECHNOLOGIES PVT LTD" | Template (not modified) |
| 4 | A–C | Client/Location | Template (not modified) |
| 4 | J+ | "TIME SHEET" | Template (not modified) |
| 6 | C | Employee name | Template (not modified) |
| 8 | C | Month short name (e.g., "Apr") | `calendar.monthName` |
| 8 | F | Year (e.g., 2026) | `calendar.year` |
| 10 | B–AF | Date numbers (1–31) | `calendar.days[].date` |
| 11 | B–AF | Day names (sun, mon, ...) | `calendar.days[].dayName` |
| 12 | B–AF | Work From Office hours | `8` if WFO mode + working day |
| 13 | B–AF | Work From Home hours | `8` if WFH mode + working day |
| 15 | D | Total working days | `calendar.totalWorkingDays` |
| 17 | B | AL allocation | `timesheetData.annual-leave-allocation` |
| 17 | C | ML allocation | `timesheetData.medical-leave-allocation` |
| 19 | B | AL used this month | Count of `annual-leave-dates` |
| 20 | B | ML used this month | Count of `medical-leave-dates` |
| 21 | B | AL pending (cumulative) | Allocation – total AL used |
| 21 | C | ML pending (cumulative) | Allocation – total ML used |
| 22 | B | Comp-off | `months[].comp-off` |
| 23 | B | Total pending AL | Same as row 21 |
| 23 | C | Total pending ML | Same as row 21 |
| 31 | A | Employee name (signature) | `employee.name` |
| 31 | G | Signature date | Current date |

## Columns for Dates (B–AF)

| Col | Letter | Date |
|-----|--------|------|
| 2 | B | 1 |
| 3 | C | 2 |
| ... | ... | ... |
| 32 | AF | 31 |

For months with fewer than 31 days, extra columns are cleared (set to null).

## Dynamic Labels

Rows 17, 19, 20, 21, 22 contain labels with month names. The code replaces any existing month name with the current month. Example:

- Before: `"Total Leave Eligibility in the Mar 2026"`
- After: `"Total Leave Eligibility in the Apr 2026"`

## Adapting for a New Template

1. Place the new template in `templates/timesheet-template.xlsx`
2. Run `npm run inspect-template` to see cell positions
3. Update `src/template-map.ts` constants to match
4. Run tests to verify: `npm test`
