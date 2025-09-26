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

export const getToday = (dayStartHHmm: string): string => {
  const now = dayjs();
  const [hour, minute] = dayStartHHmm.split(":").map(Number);
  const dayStartTime = now.hour(hour).minute(minute).second(0).millisecond(0);

  if (now.isBefore(dayStartTime)) {
    return now.subtract(1, "day").format("YYYY-MM-DD");
  }
  return now.format("YYYY-MM-DD");
};
