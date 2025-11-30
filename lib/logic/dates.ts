import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export const nowISO = (): string => dayjs().toISOString();

export const toLocalDate = (date: Date | dayjs.Dayjs | string): string =>
  dayjs(date).format("YYYY-MM-DD");

export const fromLocalDate = (dateStr: string): dayjs.Dayjs => dayjs(dateStr);

export const addDays = (date: string, days: number): string =>
  dayjs(date).add(days, "day").format("YYYY-MM-DD");

/**
 * Get the current local date based on the configured day start time.
 * 
 * This function uses the device's local timezone (e.g., Pacific Time).
 * All operations (hour, minute, format) work in local time, not UTC.
 * 
 * Example: If you're in Pacific Time (PST/PDT):
 * - At 3:59 AM Pacific with dayStart="04:00" → returns yesterday's date
 * - At 4:00 AM Pacific with dayStart="04:00" → returns today's date
 * 
 * DST (Daylight Saving Time) transitions are handled automatically by dayjs.
 * 
 * @param dayStartHHmm - Day start time in HH:mm format (e.g., "04:00")
 * @returns Local date in YYYY-MM-DD format (e.g., "2025-01-15")
 */
export const getToday = (dayStartHHmm: string): string => {
  // dayjs() uses local timezone by default - no conversion needed
  const now = dayjs();
  const [hour, minute] = dayStartHHmm.split(":").map(Number);
  // All operations here are in local timezone
  const dayStartTime = now.hour(hour).minute(minute).second(0).millisecond(0);

  if (now.isBefore(dayStartTime)) {
    return now.subtract(1, "day").format("YYYY-MM-DD");
  }
  return now.format("YYYY-MM-DD");
};

export const getSixMonthsAgo = (): string => {
  return dayjs().subtract(6, "month").format("YYYY-MM-DD");
};

export const getCurrentMonth = (): string => {
  return dayjs().format("YYYY-MM");
};

export const isDateInRange = (
  date: string,
  minDate: string,
  maxDate: string
): boolean => {
  const dateObj = dayjs(date);
  const minObj = dayjs(minDate);
  const maxObj = dayjs(maxDate);
  return dateObj.isAfter(minObj) || dateObj.isSame(minObj, "day");
};

export const isDateBefore = (date1: string, date2: string): boolean => {
  return dayjs(date1).isBefore(dayjs(date2), "day");
};

export const isDateAfter = (date1: string, date2: string): boolean => {
  return dayjs(date1).isAfter(dayjs(date2), "day");
};

export const isDateSameOrBefore = (date1: string, date2: string): boolean => {
  return (
    dayjs(date1).isSame(dayjs(date2), "day") ||
    dayjs(date1).isBefore(dayjs(date2), "day")
  );
};

export const isDateSameOrAfter = (date1: string, date2: string): boolean => {
  return (
    dayjs(date1).isSame(dayjs(date2), "day") ||
    dayjs(date1).isAfter(dayjs(date2), "day")
  );
};
