/**
 * Time slots for today's tasks. Pure: no database, no calendar.
 *
 * Times are minutes after midnight on the task's do date. Slate only places tasks
 * inside the plannable window, never in the work block (weekdays, unless the day is
 * marked off), and never over a calendar event or another task's slot. A time set by
 * hand can go anywhere; these rules only apply to suggestions.
 */
import dayjs from "dayjs";

export interface Interval {
  start: number;
  end: number;
}

export interface ScheduleSettings {
  /** HH:mm, the earliest Slate will place a task */
  windowStart: string;
  /** HH:mm, everything must end by then */
  windowEnd: string;
  workStart: string;
  workEnd: string;
  /** Days of the week with a work block, 0 = Sunday */
  workDays: number[];
}

export const DEFAULT_SCHEDULE: ScheduleSettings = {
  windowStart: "08:00",
  windowEnd: "22:00",
  workStart: "09:00",
  workEnd: "15:00",
  workDays: [1, 2, 3, 4, 5],
};

/** Length of a task with no duration set */
export const DEFAULT_DURATION = 30;
export const DURATION_CHOICES = [15, 30, 45, 60, 90, 120];
/** Suggested start times are rounded up to this */
const STEP = 5;

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const toHHmm = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** "1h 30m", "45m", "2h" */
export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
};

/** The work block on `date`, or null on a day without one */
export function workBlock(
  date: string,
  settings: ScheduleSettings,
  dayOff = false
): Interval | null {
  if (dayOff || !settings.workDays.includes(dayjs(date).day())) return null;
  const block = { start: toMinutes(settings.workStart), end: toMinutes(settings.workEnd) };
  return block.end > block.start ? block : null;
}

/** A task's slot, if it has a start time */
export function taskInterval(task: {
  startTime: string | null;
  durationMin: number | null;
}): Interval | null {
  if (!task.startTime) return null;
  const start = toMinutes(task.startTime);
  return { start, end: start + (task.durationMin ?? DEFAULT_DURATION) };
}

/**
 * The free gaps on a day: the plannable window, minus the work block and everything
 * busy, starting no earlier than `notBefore` (now, on today).
 */
export function freeGaps(
  busy: Interval[],
  settings: ScheduleSettings,
  work: Interval | null,
  notBefore = 0
): Interval[] {
  const from = Math.max(toMinutes(settings.windowStart), roundUp(notBefore));
  const to = toMinutes(settings.windowEnd);
  const blocks = [...busy, ...(work ? [work] : [])]
    .filter((b) => b.end > b.start)
    .sort((a, b) => a.start - b.start);

  const gaps: Interval[] = [];
  let cursor = from;
  for (const b of blocks) {
    if (b.start > cursor) gaps.push({ start: cursor, end: Math.min(b.start, to) });
    cursor = Math.max(cursor, roundUp(b.end));
    if (cursor >= to) break;
  }
  if (cursor < to) gaps.push({ start: cursor, end: to });
  return gaps.filter((g) => g.end > g.start);
}

/**
 * Up to `max` places a task of `duration` could go: the earliest one, then the
 * earliest in each later gap. Different gaps give real alternatives (after dinner
 * rather than five minutes later).
 */
export function suggestSlots(duration: number, gaps: Interval[], max = 2): Interval[] {
  const slots: Interval[] = [];
  for (const g of gaps) {
    if (g.end - g.start >= duration) {
      slots.push({ start: g.start, end: g.start + duration });
      if (slots.length === max) break;
    }
  }
  return slots;
}

/**
 * Places tasks one after another, each in the earliest gap it fits. Tasks are taken in
 * the order given. A task that fits nowhere is left out of the result.
 */
export function planTasks<T extends { id: string; duration: number }>(
  tasks: T[],
  gaps: Interval[]
): { id: string; start: number; end: number }[] {
  const free = gaps.map((g) => ({ ...g }));
  const placed: { id: string; start: number; end: number }[] = [];
  for (const task of tasks) {
    const gap = free.find((g) => g.end - g.start >= task.duration);
    if (!gap) continue;
    placed.push({ id: task.id, start: gap.start, end: gap.start + task.duration });
    gap.start = roundUp(gap.start + task.duration);
  }
  return placed;
}

/** Minutes after midnight for a Date, clamped to `date` (events can span days).
 * Wall-clock, so a DST change doesn't shift times by an hour. */
export function minutesOnDay(at: Date, date: string): number {
  const t = dayjs(at);
  const day = t.format("YYYY-MM-DD");
  if (day < date) return 0;
  if (day > date) return 24 * 60;
  return t.hour() * 60 + t.minute();
}

/** The Date for a wall-clock time on `date`, local time */
export function dateAt(date: string, minutes: number): Date {
  if (minutes >= 24 * 60) return dayjs(date).add(1, "day").startOf("day").toDate();
  return dayjs(date).hour(Math.floor(minutes / 60)).minute(minutes % 60).second(0).millisecond(0).toDate();
}

function roundUp(minutes: number) {
  return Math.ceil(minutes / STEP) * STEP;
}

/** Order for "Fit these in": overdue and due-soon first, then oldest first */
export function planOrder(
  a: { dueDate: string | null; createdAt: string },
  b: { dueDate: string | null; createdAt: string }
): number {
  if (a.dueDate !== b.dueDate) {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}
