export interface ParsedDate {
  year: number;
  month: number;
  day: number;
  dateString: string; // Original YYYY-MM-DD
  sortKey: number; // YYYYMMDD as integer for sorting
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

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
