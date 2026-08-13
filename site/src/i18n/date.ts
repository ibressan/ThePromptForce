/**
 * Parses a "YYYY-MM-DD" string as a LOCAL midnight Date, not UTC midnight.
 *
 * `new Date("2026-08-03")` is parsed as UTC midnight; formatting it in a
 * timezone behind UTC (e.g. BRT, UTC-3) rolls it back to "Aug 2" in the
 * browser's local time. Splitting into components and using the Date
 * constructor directly builds the date in the browser's own timezone
 * instead, so it always matches the literal YYYY-MM-DD from the filename.
 */
export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};
