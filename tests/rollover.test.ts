import assert from "assert";
import { eq } from "drizzle-orm";

import { resetDatabase } from "@/lib/db/connection";
import { habitHistory, taskHistory, tasks } from "@/lib/db/schema";
import { processRollover, storage } from "@/lib/logic/rollover";
import { addDays } from "@/lib/logic/dates";
import { randomUUID } from "expo-crypto";
import { db } from "@/lib/db/connection";
import { resetStorage } from "expo-sqlite/kv-store";

export async function run() {
  await testInitialPersistence();
  await testCarryOverOpenTasks();
}

async function testInitialPersistence() {
  resetStorage();
  resetDatabase();

  const today = "2024-02-01";
  await processRollover(today);

  const persisted = await storage.getItem("last_processed_date");
  assert.strictEqual(
    persisted,
    today,
    "processRollover should persist the current date when storage is empty"
  );
}

async function testCarryOverOpenTasks() {
  resetStorage();
  resetDatabase();

  const dayOne = "2024-03-10";
  const dayTwo = addDays(dayOne, 1);

  const taskId = randomUUID();
  await db.insert(tasks).values({
    id: taskId,
    title: "Carry me",
    notes: null,
    dueDate: null,
    scheduledFor: dayOne,
    completedAt: null,
    dependsOnTaskId: null,
    createdAt: `${dayOne}T08:00:00.000Z`,
    updatedAt: `${dayOne}T08:00:00.000Z`,
    status: "open",
  });

  await storage.setItem("last_processed_date", dayOne);

  await processRollover(dayTwo);

  const updatedTask = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .get();
  assert(updatedTask, "task should still exist after rollover");
  assert.strictEqual(
    updatedTask.scheduledFor,
    dayTwo,
    "open tasks should be rescheduled to the following day"
  );

  const historyRows = await db
    .select()
    .from(taskHistory)
    .where(eq(taskHistory.taskId, taskId));
  assert.strictEqual(
    historyRows.length,
    1,
    "rollover should create a single task history row for the finalized day"
  );
  assert.strictEqual(historyRows[0].date, dayOne);
  assert.strictEqual(historyRows[0].planned, true);
  assert.strictEqual(historyRows[0].completed, false);

  const habitRows = await db.select().from(habitHistory);
  assert.strictEqual(
    habitRows.length,
    0,
    "no habit history rows should be created when no habits exist"
  );

  const persisted = await storage.getItem("last_processed_date");
  assert.strictEqual(
    persisted,
    dayTwo,
    "rollover should persist the final processed date"
  );
}
