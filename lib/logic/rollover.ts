import {
  habitCompletions,
  habitHistory,
  habits,
  taskHistory,
  tasks,
} from "@/lib/db/schema";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { addDays, fromLocalDate, toLocalDate } from "./dates";

import { db } from "@/lib/db/connection";
import { randomUUID } from "expo-crypto";
import Storage from "expo-sqlite/kv-store";

// Using expo-sqlite's built-in key-value storage
export const storage = Storage;

async function finalizeDay(day: string) {
  console.log(`Finalizing history for day: ${day}`);

  // 1) HABIT HISTORY
  const activeHabits = await db
    .select()
    .from(habits)
    .where(eq(habits.isActive, true));
  for (const h of activeHabits) {
    const wasDone = await db
      .select()
      .from(habitCompletions)
      .where(
        and(eq(habitCompletions.habitId, h.id), eq(habitCompletions.date, day))
      )
      .get();
    await db
      .insert(habitHistory)
      .values({
        id: randomUUID(),
        date: day,
        habitId: h.id,
        completed: !!wasDone,
      })
      .onConflictDoNothing();
  }

  // 2) TASK HISTORY: planned for the day
  const plannedTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.scheduledFor, day));
  for (const t of plannedTasks) {
    const wasDoneOnDay = t.completedAt
      ? toLocalDate(t.completedAt) === day
      : false;
    await db
      .insert(taskHistory)
      .values({
        id: randomUUID(),
        date: day,
        taskId: t.id,
        planned: true,
        completed: wasDoneOnDay,
      })
      .onConflictDoNothing();
  }

  // 3) TASK HISTORY: ad-hoc completions
  const adhocTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        sql`date(completed_at) = ${day}`,
        or(isNull(tasks.scheduledFor), sql`scheduled_for != ${day}`)
      )
    );
  for (const t of adhocTasks) {
    await db
      .insert(taskHistory)
      .values({
        id: randomUUID(),
        date: day,
        taskId: t.id,
        planned: false,
        completed: true,
      })
      .onConflictDoNothing();
  }
}

export async function processRollover(nowLocalDate: string) {
  const lastProcessedDateStr = await storage.getItem("last_processed_date");
  // Note: If lastProcessedDateStr is null (fresh install or cleared KV store),
  // we default to today. This means if a user installs, uses the app, deletes it,
  // and reinstalls the next day, the previous day's rollover will be skipped.
  // This is an acceptable edge case for V1. Future improvement: track app
  // installation date and default to that instead.
  let lastProcessedDate = lastProcessedDateStr
    ? lastProcessedDateStr
    : nowLocalDate;

  while (
    fromLocalDate(lastProcessedDate).isBefore(fromLocalDate(nowLocalDate))
  ) {
    const dayToFinalize = lastProcessedDate;
    await finalizeDay(dayToFinalize);

    // Carry over unfinished tasks
    const carryOverTasks = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(eq(tasks.scheduledFor, dayToFinalize), eq(tasks.status, "open"))
      );

    const nextDay = addDays(dayToFinalize, 1);
    for (const task of carryOverTasks) {
      await db
        .update(tasks)
        .set({ scheduledFor: nextDay })
        .where(eq(tasks.id, task.id));
    }

    // Update last processed date and move to the next day
    lastProcessedDate = nextDay;
    await storage.setItem("last_processed_date", lastProcessedDate);
  }
}
