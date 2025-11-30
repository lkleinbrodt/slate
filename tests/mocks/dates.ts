import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

let forcedToday: string | null = null;

export const setMockToday = (date: string | null) => {
  forcedToday = date;
};

export const nowISO = (): string => dayjs().toISOString();

export const toLocalDate = (date: Date | dayjs.Dayjs | string): string =>
  dayjs(date).format("YYYY-MM-DD");

export const fromLocalDate = (dateStr: string): dayjs.Dayjs => dayjs(dateStr);

export const addDays = (date: string, days: number): string =>
  dayjs(date).add(days, "day").format("YYYY-MM-DD");

export const getToday = (dayStartHHmm: string): string => {
  if (forcedToday) {
    return forcedToday;
  }
  const now = dayjs();
  const [hour, minute] = dayStartHHmm.split(":").map(Number);
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
