import { and, desc, eq, lte } from "drizzle-orm";

import { db } from "@/lib/db/connection";
import { habitHistory } from "@/lib/db/schema";
import { addDays } from "./dates";

export async function calculateStreak(
  habitId: string,
  refDate: string
): Promise<number> {
  // Query habit history for this habit, ordered by date descending
  // Limit to 365 days to avoid loading excessive data
  const completions = await db
    .select()
    .from(habitHistory)
    .where(
      and(
        eq(habitHistory.habitId, habitId),
        lte(habitHistory.date, refDate) // Only dates up to and including refDate
      )
    )
    .orderBy(desc(habitHistory.date))
    .limit(365);

  // Create a map for O(1) lookup: date -> completion status
  const completionMap = new Map<string, boolean>();
  for (const completion of completions) {
    completionMap.set(completion.date, completion.completed);
  }

  // Calculate streak by checking consecutive days starting from refDate going backwards
  let streak = 0;
  let currentDate = refDate;

  while (true) {
    const wasCompleted = completionMap.get(currentDate);
    if (wasCompleted === true) {
      // This day was completed, continue the streak
      streak++;
      currentDate = addDays(currentDate, -1);
    } else {
      // This day was not completed (or doesn't exist in history), streak is broken
      break;
    }
  }

  return streak;
}

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
