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

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Everything below runs inside one synchronous transaction per day, so a crash
// mid-rollover can't leave a day half-finalized. (drizzle's SQLite transactions
// are synchronous; an async callback would commit before its awaits finish.)
function finalizeDay(tx: Tx, day: string) {
  console.log(`Finalizing history for day: ${day}`);

  // 1) HABIT HISTORY
  // Active habits that existed on this day, plus any habit completed that day
  // (covers habits deleted after being completed).
  const allHabits = tx.select().from(habits).all();
  const completions = tx
    .select()
    .from(habitCompletions)
    .where(eq(habitCompletions.date, day))
    .all();
  const completedIds = new Set(completions.map((c) => c.habitId));
  const habitsForDay = allHabits.filter(
    (h) =>
      completedIds.has(h.id) ||
      (h.isActive && toLocalDate(h.createdAt) <= day)
  );
  for (const h of habitsForDay) {
    tx.insert(habitHistory)
      .values({
        id: randomUUID(),
        date: day,
        habitId: h.id,
        completed: completedIds.has(h.id),
      })
      .onConflictDoNothing()
      .run();
  }

  // 2) TASK HISTORY: planned for the day (skip tasks deleted without being done)
  const plannedTasks = tx
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.scheduledFor, day),
        sql`NOT (status = 'archived' AND completed_date IS NULL)`
      )
    )
    .all();
  for (const t of plannedTasks) {
    tx.insert(taskHistory)
      .values({
        id: randomUUID(),
        date: day,
        taskId: t.id,
        planned: true,
        completed: t.completedDate === day,
      })
      .onConflictDoNothing()
      .run();
  }

  // 3) TASK HISTORY: completed on the day without being planned for it
  const adhocTasks = tx
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.completedDate, day),
        sql`(scheduled_for IS NULL OR scheduled_for != ${day})`
      )
    )
    .all();
  for (const t of adhocTasks) {
    tx.insert(taskHistory)
      .values({
        id: randomUUID(),
        date: day,
        taskId: t.id,
        planned: false,
        completed: true,
      })
      .onConflictDoNothing()
      .run();
  }

  // 4) Carry over unfinished tasks to the next day
  tx.update(tasks)
    .set({ scheduledFor: addDays(day, 1) })
    .where(and(eq(tasks.scheduledFor, day), eq(tasks.status, "open")))
    .run();
}

/**
 * Pull open tasks that are due (or overdue) by `day` into that day's plan.
 * Runs only when a new day starts, so moving one back out of Today (snooze,
 * send back to Slate) sticks until tomorrow morning.
 */
function pullInDueTasks(tx: Tx, day: string) {
  tx.update(tasks)
    .set({ scheduledFor: day })
    .where(
      and(
        eq(tasks.status, "open"),
        sql`due_date <= ${day}`,
        sql`(scheduled_for IS NULL OR scheduled_for > ${day})`
      )
    )
    .run();
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
    const nextDay = addDays(dayToFinalize, 1);
    db.transaction((tx) => {
      finalizeDay(tx, dayToFinalize);
      if (nextDay === nowLocalDate) pullInDueTasks(tx, nextDay);
    });

    // Lives in a separate KV database, so it can't join the transaction. If
    // we crash before this write, re-running the day is harmless: history
    // inserts ignore duplicates and its open tasks have already moved on.
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
