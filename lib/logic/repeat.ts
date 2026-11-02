import dayjs from "dayjs";
import { addDays } from "./dates";

/**
 * How a repeating task recurs. Stored on the task as a short string
 * (`every:2`, `weekdays:2,4`, `monthday:30`) so it fits one column.
 *
 * - every: N days after the day the task was finished (rhythm shifts if you rest)
 * - weekdays: fixed days of the week (0 = Sunday)
 * - monthday: fixed day of the month; short months use their last day
 */
export type RepeatRule =
  | { type: "every"; days: number }
  | { type: "weekdays"; days: number[] }
  | { type: "monthday"; day: number };

export function serializeRule(rule: RepeatRule): string {
  switch (rule.type) {
    case "every":
      return `every:${rule.days}`;
    case "weekdays":
      return `weekdays:${[...rule.days].sort((a, b) => a - b).join(",")}`;
    case "monthday":
      return `monthday:${rule.day}`;
  }
}

export function parseRule(value: string | null | undefined): RepeatRule | null {
  if (!value) return null;
  const [type, arg = ""] = value.split(":");
  const nums = arg.split(",").map(Number);
  if (nums.some((n) => !Number.isInteger(n))) return null;
  if (type === "every" && nums.length === 1 && nums[0] >= 1) {
    return { type, days: nums[0] };
  }
  if (type === "weekdays" && nums.every((n) => n >= 0 && n <= 6)) {
    return { type, days: [...new Set(nums)].sort((a, b) => a - b) };
  }
  if (type === "monthday" && nums.length === 1 && nums[0] >= 1 && nums[0] <= 31) {
    return { type, day: nums[0] };
  }
  return null;
}

/**
 * The next date the task should appear, given the day it was finished and the day
 * it was meant for (`intended`, its due date). Fixed-calendar rules look past the
 * later of the two, so finishing Thursday's task early on Wednesday doesn't
 * schedule Thursday again, and finishing Tuesday's on Wednesday gives Thursday.
 */
export function nextOccurrence(
  rule: RepeatRule,
  completedOn: string,
  intended?: string | null
): string {
  const after = intended && intended > completedOn ? intended : completedOn;
  switch (rule.type) {
    case "every":
      return addDays(completedOn, rule.days);
    case "weekdays": {
      const days = rule.days.length ? rule.days : [dayjs(after).day()];
      for (let i = 1; i <= 7; i++) {
        const candidate = addDays(after, i);
        if (days.includes(dayjs(candidate).day())) return candidate;
      }
      return addDays(after, 7);
    }
    case "monthday": {
      const thisMonth = monthDate(dayjs(after), rule.day);
      if (thisMonth > after) return thisMonth;
      return monthDate(dayjs(after).startOf("month").add(1, "month"), rule.day);
    }
  }
}

function monthDate(month: dayjs.Dayjs, day: number): string {
  return month.date(Math.min(day, month.daysInMonth())).format("YYYY-MM-DD");
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

export function ruleLabel(rule: RepeatRule): string {
  switch (rule.type) {
    case "every":
      if (rule.days === 1) return "Every day";
      if (rule.days === 2) return "Every other day";
      if (rule.days === 7) return "Every week";
      return `Every ${rule.days} days`;
    case "weekdays": {
      const key = rule.days.join(",");
      if (key === "1,2,3,4,5") return "Weekdays";
      if (key === "0,6") return "Weekends";
      if (rule.days.length === 7) return "Every day";
      return `Every ${rule.days.map((d) => WEEKDAY_NAMES[d]).join("/")}`;
    }
    case "monthday":
      return `Monthly on the ${ordinal(rule.day)}`;
  }
}
