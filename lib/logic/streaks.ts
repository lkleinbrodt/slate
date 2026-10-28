import { and, eq, gte, lt } from "drizzle-orm";

import { db } from "@/lib/db/connection";
import { habitHistory } from "@/lib/db/schema";
import { addDays } from "./dates";

const MAX_STREAK_LOOKBACK_DAYS = 365;

/**
 * Streak of consecutive completed days ending *yesterday*, per habit.
 *
 * Today is excluded on purpose: it lives in habit_completions until rollover,
 * and an unfinished today shouldn't break the streak. Callers add 1 when the
 * habit is completed today (see `displayStreak`).
 */
export async function calculateBaseStreaks(
  habitIds: string[],
  today: string
): Promise<Record<string, number>> {
  const streaks: Record<string, number> = {};
  for (const id of habitIds) streaks[id] = 0;
  if (habitIds.length === 0) return streaks;

  const rows = await db
    .select({
      habitId: habitHistory.habitId,
      date: habitHistory.date,
    })
    .from(habitHistory)
    .where(
      and(
        eq(habitHistory.completed, true),
        gte(habitHistory.date, addDays(today, -MAX_STREAK_LOOKBACK_DAYS)),
        lt(habitHistory.date, today)
      )
    );

  const completedDates = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!completedDates.has(row.habitId)) {
      completedDates.set(row.habitId, new Set());
    }
    completedDates.get(row.habitId)!.add(row.date);
  }

  for (const id of habitIds) {
    const dates = completedDates.get(id);
    if (!dates) continue;
    let day = addDays(today, -1);
    let streak = 0;
    while (dates.has(day)) {
      streak++;
      day = addDays(day, -1);
    }
    streaks[id] = streak;
  }
  return streaks;
}

export const displayStreak = (baseStreak: number, completedToday: boolean) =>
  baseStreak + (completedToday ? 1 : 0);

export async function isPerfectDay(date: string): Promise<boolean> {
  const habitsForDay = await db
    .select()
    .from(habitHistory)
    .where(eq(habitHistory.date, date));
  if (habitsForDay.length === 0) {
    return false; // Not a perfect day if no habits were tracked
  }
  return habitsForDay.every((h) => h.completed);
}
