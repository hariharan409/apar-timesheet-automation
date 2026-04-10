import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createLogger } from './logger.js';
import type { AppConfig, HolidayEntry } from './types.js';

const log = createLogger('holidays');

interface CalendarificResponse {
  response: {
    holidays: Array<{
      name: string;
      date: { iso: string };
      type: string[];
    }>;
  };
}

/**
 * Get Singapore public holidays for a given year.
 * Uses local cache first, falls back to Calendarific API.
 * Returns a Map of date string → holiday name.
 */
export async function getHolidays(
  year: number,
  config: Readonly<AppConfig>,
): Promise<Map<string, string>> {
  const cacheDir = config.paths.holidaysCache;
  const cachePath = resolve(cacheDir, `${year}.json`);

  // Try cache first
  if (existsSync(cachePath)) {
    log.info(`Loading holidays for ${year} from cache`);
    const cached = JSON.parse(await readFile(cachePath, 'utf-8')) as HolidayEntry[];
    return toHolidayMap(cached);
  }

  // Fetch from API
  try {
    log.info(`Fetching holidays for ${year} from Calendarific API`);
    const url = new URL('https://calendarific.com/api/v2/holidays');
    url.searchParams.set('api_key', config.calendarificApiKey);
    url.searchParams.set('country', 'SG');
    url.searchParams.set('year', String(year));
    url.searchParams.set('type', 'national');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Calendarific API returned ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as CalendarificResponse;
    const holidays: HolidayEntry[] = data.response.holidays.map((h) => ({
      name: h.name,
      date: h.date.iso.slice(0, 10),
    }));

    // Cache for future use
    if (!existsSync(cacheDir)) {
      await mkdir(cacheDir, { recursive: true });
    }
    await writeFile(cachePath, JSON.stringify(holidays, null, 2), 'utf-8');
    log.info(`Cached ${holidays.length} holidays for ${year}`);

    return toHolidayMap(holidays);
  } catch (err) {
    log.error(`Failed to fetch holidays for ${year}:`, err);

    // Fallback: try cache from a previous call (shouldn't exist if we got here, but safety net)
    if (existsSync(cachePath)) {
      log.warn('Using cached holidays as fallback');
      const cached = JSON.parse(await readFile(cachePath, 'utf-8')) as HolidayEntry[];
      return toHolidayMap(cached);
    }

    log.warn('No holiday data available — proceeding without holidays');
    return new Map();
  }
}

/**
 * Filter holidays for a specific month.
 */
export function filterHolidaysForMonth(
  holidays: Map<string, string>,
  year: number,
  month: number,
): Map<string, string> {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const filtered = new Map<string, string>();
  for (const [date, name] of holidays) {
    if (date.startsWith(prefix)) {
      filtered.set(date, name);
    }
  }
  return filtered;
}

function toHolidayMap(entries: HolidayEntry[]): Map<string, string> {
  return new Map(entries.map((h) => [h.date, h.name]));
}
