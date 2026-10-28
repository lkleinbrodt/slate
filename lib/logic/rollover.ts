import {
  habitCompletions,
  habitHistory,
  habits,
  taskHistory,
  tasks,
} from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { addDays, fromLocalDate, toLocalDate } from "./dates";

import { db } from "@/lib/db/connection";
import { randomUUID } from "expo-crypto";
import Storage from "expo-sqlite/kv-store";

// Using expo-sqlite's built-in key-value storage
export const storage = Storage;

async function finalizeDay(day: string) {
  console.log(`Finalizing history for day: ${day}`);

  // 1) HABIT HISTORY
  // Active habits that existed on this day, plus any habit completed that day
  // (covers habits deleted after being completed).
  const [allHabits, completions] = await Promise.all([
    db.select().from(habits),
    db.select().from(habitCompletions).where(eq(habitCompletions.date, day)),
  ]);
  const completedIds = new Set(completions.map((c) => c.habitId));
  const habitsForDay = allHabits.filter(
    (h) =>
      completedIds.has(h.id) ||
      (h.isActive && toLocalDate(h.createdAt) <= day)
  );
  for (const h of habitsForDay) {
    await db
      .insert(habitHistory)
      .values({
        id: randomUUID(),
        date: day,
        habitId: h.id,
        completed: completedIds.has(h.id),
      })
      .onConflictDoNothing();
  }

  // 2) TASK HISTORY: planned for the day (skip tasks deleted without being done)
  const plannedTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.scheduledFor, day),
        sql`NOT (status = 'archived' AND completed_date IS NULL)`
      )
    );
  for (const t of plannedTasks) {
    await db
      .insert(taskHistory)
      .values({
        id: randomUUID(),
        date: day,
        taskId: t.id,
        planned: true,
        completed: t.completedDate === day,
      })
      .onConflictDoNothing();
  }

  // 3) TASK HISTORY: completed on the day without being planned for it
  const adhocTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.completedDate, day),
        sql`(scheduled_for IS NULL OR scheduled_for != ${day})`
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

async function runRollover(nowLocalDate: string) {
  const lastProcessedDateStr = await storage.getItem("last_processed_date");
  // Note: If lastProcessedDateStr is null (fresh install or cleared KV store),
  // we default to today. This means if a user installs, uses the app, deletes it,
  // and reinstalls the next day, the previous day's rollover will be skipped.
  // This is an acceptable edge case for V1. Future improvement: track app
  // installation date and default to that instead.
  let lastProcessedDate = lastProcessedDateStr
    ? lastProcessedDateStr
    : nowLocalDate;

  if (!lastProcessedDateStr) {
    await storage.setItem("last_processed_date", lastProcessedDate);
  }

  console.log(`Processing rollover from ${lastProcessedDate} to ${nowLocalDate}`);

  while (
    fromLocalDate(lastProcessedDate).isBefore(fromLocalDate(nowLocalDate))
  ) {
    const dayToFinalize = lastProcessedDate;
    await finalizeDay(dayToFinalize);

    // Carry over unfinished tasks to the next day
    const nextDay = addDays(dayToFinalize, 1);
    await db
      .update(tasks)
      .set({ scheduledFor: nextDay })
      .where(
        and(eq(tasks.scheduledFor, dayToFinalize), eq(tasks.status, "open"))
      );

    // Update last processed date and move to the next day
    lastProcessedDate = nextDay;
    await storage.setItem("last_processed_date", lastProcessedDate);
  }
}

// Rollover can be triggered from app start, foregrounding, and the minute
// timer; serialize runs so two of them never process the same day at once.
let inFlight: Promise<void> = Promise.resolve();

export function processRollover(nowLocalDate: string): Promise<void> {
  const run = inFlight.then(() => runRollover(nowLocalDate));
  inFlight = run.catch((err) => {
    console.error("Rollover failed", err);
  });
  return run;
}
