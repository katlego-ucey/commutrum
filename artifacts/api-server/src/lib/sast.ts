/**
 * SAST (South African Standard Time = UTC+2) timezone utilities.
 * Issue #43: all timestamps stored in UTC, displayed/parsed in SAST.
 *
 * Rule: never use `new Date()` raw in business logic — always go through
 * these helpers so timezone handling is explicit and testable.
 */

export const SAST_OFFSET_HOURS = 2;
export const SAST_TZ = "Africa/Johannesburg";

/** Returns the current date string in SAST (YYYY-MM-DD). */
export function todaySast(): string {
  return new Date(
    Date.now() + SAST_OFFSET_HOURS * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 10);
}

/** Converts a UTC Date to a SAST date string (YYYY-MM-DD). */
export function toSastDate(utcDate: Date): string {
  return new Date(utcDate.getTime() + SAST_OFFSET_HOURS * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

/** JSE market open and close in UTC. */
export const JSE_OPEN_UTC = { hour: 7, minute: 0 };
export const JSE_CLOSE_UTC = { hour: 14, minute: 50 };

/** Returns true if the current UTC time is within JSE trading hours. */
export function isJseTradingHours(now = new Date()): boolean {
  const h = now.getUTCHours();
  const m = now.getUTCMinutes();
  const minutesFromMidnight = h * 60 + m;
  const openMinutes = JSE_OPEN_UTC.hour * 60 + JSE_OPEN_UTC.minute;
  const closeMinutes = JSE_CLOSE_UTC.hour * 60 + JSE_CLOSE_UTC.minute;
  return minutesFromMidnight >= openMinutes && minutesFromMidnight < closeMinutes;
}
