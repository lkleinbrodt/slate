import assert from "assert";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/connection";
import { resetDatabase } from "./mocks/db-connection";
import { habitHistory, taskHistory, tasks } from "@/lib/db/schema";
import { processRollover, storage } from "@/lib/logic/rollover";
import { addDays } from "@/lib/logic/dates";
import { resetStorage } from "./mocks/kv-store";
import { completeHabitOn, insertHabit, insertTask } from "./helpers";

export async function run() {
  await testInitialPersistence();
  await testCarryOverOpenTasks();
  await testCompletedTaskUsesLogicalCompletionDay();
  await testDeletedOpenTaskNotInHistory();
  await testHabitHistoryOnlyForHabitsThatExisted();
}

function reset() {
  resetStorage();
  resetDatabase();
}

async function getTask(id: string) {
  return db.select().from(tasks).where(eq(tasks.id, id)).get();
}

async function testInitialPersistence() {
  reset();

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
  reset();

  const dayOne = "2024-03-10";
  const dayThree = addDays(dayOne, 2);
  const task = await insertTask({ title: "Carry me", scheduledFor: dayOne });

  await storage.setItem("last_processed_date", dayOne);
  await processRollover(dayThree);

  const updatedTask = await getTask(task.id);
  assert.strictEqual(
    updatedTask?.scheduledFor,
    dayThree,
    "open tasks should be carried forward day by day to today"
  );

  const historyRows = await db
    .select()
    .from(taskHistory)
    .where(eq(taskHistory.taskId, task.id));
  assert.deepStrictEqual(
    historyRows.map((r) => [r.date, r.planned, r.completed]).sort(),
    [
      [dayOne, true, false],
      [addDays(dayOne, 1), true, false],
    ],
    "each missed day should be recorded as planned but not completed"
  );

  const habitRows = await db.select().from(habitHistory);
  assert.strictEqual(habitRows.length, 0, "no habits, no habit history");

  assert.strictEqual(await storage.getItem("last_processed_date"), dayThree);
}

async function testCompletedTaskUsesLogicalCompletionDay() {
  reset();

  // Completed at 1:30am UTC on the 11th, but the app's logical day was the
  // 10th (e.g. evening in the US, or before the 4am day start).
  const day = "2024-03-10";
  const task = await insertTask({
    scheduledFor: day,
    status: "done",
    completedAt: "2024-03-11T01:30:00.000Z",
    completedDate: day,
  });

  await storage.setItem("last_processed_date", day);
  await processRollover(addDays(day, 1));

  const rows = await db
    .select()
    .from(taskHistory)
    .where(eq(taskHistory.taskId, task.id));
  assert.deepStrictEqual(
    rows.map((r) => [r.date, r.planned, r.completed]),
    [[day, true, true]],
    "completion should count for the logical day it happened on"
  );
  assert.strictEqual(
    (await getTask(task.id))?.scheduledFor,
    day,
    "completed tasks are not carried over"
  );
}

async function testDeletedOpenTaskNotInHistory() {
  reset();

  const day = "2024-04-01";
  const task = await insertTask({ scheduledFor: day, status: "archived" });

  await storage.setItem("last_processed_date", day);
  await processRollover(addDays(day, 1));

  const rows = await db
    .select()
    .from(taskHistory)
    .where(eq(taskHistory.taskId, task.id));
  assert.strictEqual(rows.length, 0, "deleted, unfinished tasks are not history");
}

async function testHabitHistoryOnlyForHabitsThatExisted() {
  reset();

  const day = "2024-05-01";
  const oldHabit = await insertHabit({ createdAt: "2024-04-01T12:00:00.000Z" });
  const newHabit = await insertHabit({ createdAt: "2024-05-03T12:00:00.000Z" });
  const deletedHabit = await insertHabit({
    isActive: false,
    createdAt: "2024-04-01T12:00:00.000Z",
  });
  await completeHabitOn(oldHabit.id, day);
  await completeHabitOn(deletedHabit.id, day);

  await storage.setItem("last_processed_date", day);
  await processRollover(addDays(day, 1));

  const rows = await db
    .select()
    .from(habitHistory)
    .where(eq(habitHistory.date, day));
  const byHabit = new Map(rows.map((r) => [r.habitId, r.completed]));
  assert.strictEqual(byHabit.get(oldHabit.id), true);
  assert.strictEqual(
    byHabit.get(deletedHabit.id),
    true,
    "a habit completed that day keeps its history even if deleted since"
  );
  assert.strictEqual(
    byHabit.has(newHabit.id),
    false,
    "habits created after the day shouldn't count as missed"
  );
}
