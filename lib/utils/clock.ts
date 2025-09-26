import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

export type LocalDate = string; // YYYY-MM-DD format
export type DateTime = string; // ISO string with timezone
export type HHmm = string; // HH:mm format

/**
 * Calculate the local "today" based on the configured day start time
 * @param dayStartHHmm - Day start time in HH:mm format (e.g., "04:00")
 * @param now - Current datetime (defaults to now)
 * @returns Local date in YYYY-MM-DD format
 */
export function localToday(dayStartHHmm: string, now?: DateTime): LocalDate {
  const current = now ? dayjs(now) : dayjs();
  const [hour, minute] = dayStartHHmm.split(":").map(Number);

  // Create day start time for today
  const dayStart = current.hour(hour).minute(minute).second(0).millisecond(0);

  // If current time is before day start, we're still in "yesterday"
  if (current.isBefore(dayStart)) {
    return current.subtract(1, "day").format("YYYY-MM-DD");
  }

  return current.format("YYYY-MM-DD");
}

/**
 * Get the previous day
 */
export function prevDay(date: LocalDate): LocalDate {
  return dayjs(date).subtract(1, "day").format("YYYY-MM-DD");
}

/**
 * Get the next day
 */
export function nextDay(date: LocalDate): LocalDate {
  return dayjs(date).add(1, "day").format("YYYY-MM-DD");
}

/**
 * Check if a date is today based on day start
 */
export function isToday(date: LocalDate, dayStartHHmm: string): boolean {
  return date === localToday(dayStartHHmm);
}

/**
 * Get current datetime as ISO string with timezone
 */
export function now(): DateTime {
  return dayjs().toISOString();
}

/**
 * Format a local date for display
 */
export function formatLocalDate(
  date: LocalDate,
  format: string = "MMM D"
): string {
  return dayjs(date).format(format);
}

/**
 * Parse a local date string
 */
export function parseLocalDate(dateStr: string): dayjs.Dayjs {
  return dayjs(dateStr);
}

/**
 * Get start of day for a local date (useful for comparisons)
 */
export function startOfLocalDay(date: LocalDate): DateTime {
  return dayjs(date).startOf("day").toISOString();
}

/**
 * Get end of day for a local date
 */
export function endOfLocalDay(date: LocalDate): DateTime {
  return dayjs(date).endOf("day").toISOString();
}
