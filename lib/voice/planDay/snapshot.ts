import * as repo from "@/lib/logic/repo";

import { calculateBaseStreaks, displayStreak } from "@/lib/logic/streaks";

import { type Interval, type ScheduleSettings, freeGaps, taskInterval } from "@/lib/logic/schedule";

import { addDays } from "@/lib/logic/dates";

// What a plan-the-day call knows about the day, read once when the call starts. The same
// snapshot feeds the call's instructions and the extraction afterwards, so the refs
// (t1, t2, …) the extraction answers with are the ones the data showed. Plain JSON, so a
// voice session can store it.

/** Open tasks beyond this many (least urgent first) are left out of the Slate list. */
export const MAX_SLATE_TASKS = 80;

/** Unplanned tasks read out in the opening overview; the rest are counted. */
export const MAX_UNPLANNED_SHOWN = 5;

export interface PlanTask {
  ref: string;
  id: string;
  title: string;
  notes: string | null;
  doDate: string | null;
  dueDate: string | null;
  done: boolean;
  /** On Today because it was planned for yesterday and not finished. */
  carriedOver: boolean;
  /** Its slot on today, HH:mm, or null. Optional: snapshots saved before time slots lack it. */
  startTime?: string | null;
  /** How long it takes, in minutes, or null (not set). */
  durationMin?: number | null;
}

/** Something on his calendar today, in minutes after midnight. */
export interface PlanEvent {
  title: string;
  start: number;
  end: number;
  /** false for a "Just to see" calendar: shown, but free to plan over */
  busy: boolean;
}

/** Today's shape for times (lib/logic/schedule.ts), read when the call starts. */
export interface PlanSchedule {
  /** Minutes after midnight when the call started */
  now: number;
  /** The work block, or null on a day without one */
  work: Interval | null;
  /** Timed events from his calendars (not Slate's own), busy or just to see */
  events: PlanEvent[];
  /** Where Slate would put things: the plannable window minus work, busy events, today's
   * slots and the time already past */
  free: Interval[];
}

/** An open task whose due date has passed. Named in the overview, so it's kept whole. */
export interface PlanOverdue {
  title: string;
  dueDate: string;
}

export interface PlanHabit {
  title: string;
  doneToday: boolean;
  /** Days in a row, counting today if it's done. */
  streak: number;
}

export interface DaySnapshot {
  /** The logical day (day start respected), YYYY-MM-DD. */
  date: string;
  /** On Today: open tasks planned for today, and tasks done today. */
  today: PlanTask[];
  /** Every other open task, most urgent first. */
  slate: PlanTask[];
  /** Open tasks left out of `slate` to keep the call's prompt a sensible size. */
  slateOmitted: number;
  /** Every open task past its due date, most overdue first. Includes ones on today. */
  overdue: PlanOverdue[];
  /** Open tasks with no do date, counted over all of them (not just what `slate` shows). */
  unplannedCount: number;
  /** Titles of the most urgent unplanned tasks, up to MAX_UNPLANNED_SHOWN. */
  unplannedTitles: string[];
  habits: PlanHabit[];
  /** Missing when the call couldn't read it, and on snapshots saved before time slots. */
  schedule?: PlanSchedule;
}

/** What the snapshot needs beyond the database to describe today's times. */
export interface DayShape {
  now: number;
  settings: ScheduleSettings;
  work: Interval | null;
  events: { title: string; start: number; end: number; allDay: boolean; busy: boolean }[];
}

export async function buildDaySnapshot(date: string, shape?: DayShape): Promise<DaySnapshot> {
  const yesterday = addDays(date, -1);
  const [todayTasks, openTasks, activeHabits, completions, yesterdayTasks] = await Promise.all([
    repo.listTodayTasks(date),
    repo.listAllTasks(),
    repo.listActiveHabits(),
    repo.getHabitCompletionsForDate(date),
    repo.getDayTasksHistory(yesterday),
  ]);
  const streaks = await calculateBaseStreaks(activeHabits.map((h) => h.id), date);

  const unfinishedYesterday = new Set(
    yesterdayTasks.filter((r) => r.task_history.planned && !r.task_history.completed).map((r) => r.task_history.taskId)
  );
  const onToday = new Set(todayTasks.map((t) => t.id));
  const rest = openTasks.filter((t) => !onToday.has(t.id)).sort(bySlateUrgency);
  const slate = rest.slice(0, MAX_SLATE_TASKS);
  // Unplanned tasks sort last, so they're the ones the slate cap would drop: count them from `rest`.
  const unplanned = rest.filter((t) => !t.scheduledFor);

  let n = 0;
  const toPlanTask = (t: repo.Task): PlanTask => ({
    ref: `t${++n}`,
    id: t.id,
    title: t.title,
    notes: t.notes,
    doDate: t.scheduledFor,
    dueDate: t.dueDate,
    done: t.status === "done",
    carriedOver: t.status === "open" && unfinishedYesterday.has(t.id),
    startTime: t.startTime,
    durationMin: t.durationMin,
  });
  const done = new Set(completions.map((c) => c.habitId));

  return {
    date,
    // Open first, so the list reads as what's left; timed ones in time order, then the rest
    today: [...todayTasks].sort(byTodayOrder).map(toPlanTask),
    slate: slate.map(toPlanTask),
    slateOmitted: rest.length - slate.length,
    overdue: openTasks
      .filter((t) => t.dueDate && t.dueDate < date)
      .sort(bySlateUrgency)
      .flatMap((t) => (t.dueDate ? [{ title: t.title, dueDate: t.dueDate }] : [])),
    unplannedCount: unplanned.length,
    unplannedTitles: unplanned.slice(0, MAX_UNPLANNED_SHOWN).map((t) => t.title),
    habits: activeHabits.map((h) => ({
      title: h.title,
      doneToday: done.has(h.id),
      streak: displayStreak(streaks[h.id] ?? 0, done.has(h.id)),
    })),
    ...(shape ? { schedule: daySchedule(shape, todayTasks) } : {}),
  };
}

function daySchedule(shape: DayShape, todayTasks: repo.Task[]): PlanSchedule {
  const events = shape.events
    .filter((e) => !e.allDay)
    .map((e) => ({ title: e.title, start: e.start, end: e.end, busy: e.busy }));
  const busy: Interval[] = events.filter((e) => e.busy);
  for (const t of todayTasks) {
    const slot = t.status === "open" ? taskInterval(t) : null;
    if (slot) busy.push(slot);
  }
  return { now: shape.now, work: shape.work, events, free: freeGaps(busy, shape.settings, shape.work, shape.now) };
}

function byTodayOrder(a: repo.Task, b: repo.Task): number {
  return (
    Number(a.status === "done") - Number(b.status === "done") ||
    compareDates(a.startTime, b.startTime)
  );
}

/** Due soonest first (overdue at the top), then planned soonest, then newest. */
function bySlateUrgency(a: repo.Task, b: repo.Task): number {
  return (
    compareDates(a.dueDate, b.dueDate) ||
    compareDates(a.scheduledFor, b.scheduledFor) ||
    b.createdAt.localeCompare(a.createdAt)
  );
}

/** Earlier first; no date sorts last. */
function compareDates(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}

/** Every task the snapshot showed, by ref. */
export function tasksByRef(snapshot: DaySnapshot): Map<string, PlanTask> {
  return new Map([...snapshot.today, ...snapshot.slate].map((t) => [t.ref, t]));
}
