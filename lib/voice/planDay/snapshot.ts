import * as repo from "@/lib/logic/repo";

import { calculateBaseStreaks, displayStreak } from "@/lib/logic/streaks";

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
}

export async function buildDaySnapshot(date: string): Promise<DaySnapshot> {
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
  });
  const done = new Set(completions.map((c) => c.habitId));

  return {
    date,
    // Open first, so the list reads as what's left
    today: [...todayTasks].sort((a, b) => Number(a.status === "done") - Number(b.status === "done")).map(toPlanTask),
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
  };
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
