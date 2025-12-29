export interface ParsedDate {
  year: number;
  month: number;
  day: number;
  dateString: string; // Computed YYYY-MM-DD
  sortKey: number; // YYYYMMDD as integer for sorting
  originalFormat?: string; // Original format if different (e.g., "2025-W52" for weekly notes)
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const WEEKLY_PATTERN = /^(\d{4})-W(\d{1,2})/;

/**
 * Attempts to parse a YYYY-MM-DD date from the beginning of a string.
 * Returns null if the string does not start with a valid date.
 */
export function parseDate(input: string): ParsedDate | null {
  const match = input.match(DATE_PATTERN);
  if (!match) return null;

  const [, yearStr, monthStr, dayStr] = match;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // Validate date components
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  return {
    year,
    month,
    day,
    dateString: `${yearStr}-${monthStr}-${dayStr}`,
    sortKey: year * 10000 + month * 100 + day,
  };
}

/**
 * Parse date from a filename (convenience wrapper).
 */
export function parseFilename(filename: string): ParsedDate | null {
  return parseDate(filename);
}

/**
 * Parse date from heading text (for future heading support).
 */
export function parseHeading(headingText: string): ParsedDate | null {
  return parseDate(headingText);
}

/**
 * Computes the Sunday that starts a given week of the year (Sunday-based weeks).
 * Week 1 is the first week containing a Sunday in the year.
 */
export function sundayOfWeek(
  year: number,
  week: number
): { year: number; month: number; day: number } {
  // Find Jan 1 of the given year
  const jan1 = new Date(year, 0, 1);
  const jan1DayOfWeek = jan1.getDay(); // 0=Sunday, 1=Monday, etc.

  // Days until first Sunday: if Jan 1 is Sunday (0), it's 0 days; else 7 - dayOfWeek
  const daysToFirstSunday = jan1DayOfWeek === 0 ? 0 : 7 - jan1DayOfWeek;

  // Week 1 starts on the first Sunday of the year
  // Add (week - 1) * 7 days to get to week N
  const targetDate = new Date(year, 0, 1 + daysToFirstSunday + (week - 1) * 7);

  return {
    year: targetDate.getFullYear(),
    month: targetDate.getMonth() + 1,
    day: targetDate.getDate(),
  };
}

/**
 * Attempts to parse a YYYY-Www weekly date from the beginning of a string.
 * Returns null if the string does not start with a valid weekly date.
 */
export function parseWeeklyDate(input: string): ParsedDate | null {
  const match = input.match(WEEKLY_PATTERN);
  if (!match) return null;

  const [matchedPart, yearStr, weekStr] = match;
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  // Validate week number (1-53)
  if (week < 1 || week > 53) return null;

  const { year: computedYear, month, day } = sundayOfWeek(year, week);

  const monthStr = String(month).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");

  return {
    year: computedYear,
    month,
    day,
    dateString: `${computedYear}-${monthStr}-${dayStr}`,
    sortKey: computedYear * 10000 + month * 100 + day,
    originalFormat: matchedPart,
  };
}

/**
 * Parse date from a filename, trying daily format first, then weekly format.
 * Returns null if no date format matches.
 */
export function parseFilenameExtended(filename: string): ParsedDate | null {
  // Try daily format first (YYYY-MM-DD)
  const dailyParsed = parseDate(filename);
  if (dailyParsed) return dailyParsed;

  // Try weekly format (YYYY-Www)
  return parseWeeklyDate(filename);
}
