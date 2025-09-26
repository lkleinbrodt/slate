import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/connection";
import { habitHistory } from "@/lib/db/schema";
import { addDays } from "./dates";

export async function calculateStreak(
  habitId: string,
  refDate: string
): Promise<number> {
  let streak = 0;
  let currentDate = refDate;

  while (true) {
    const completion = await db
      .select()
      .from(habitHistory)
      .where(
        and(
          eq(habitHistory.habitId, habitId),
          eq(habitHistory.date, currentDate)
        )
      )
      .get();

    if (completion && completion.completed) {
      streak++;
      currentDate = addDays(currentDate, -1);
    } else {
      break; // Streak is broken
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
