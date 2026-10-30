import assert from "assert";
import dayjs from "dayjs";

import { buildWidgetSnapshot } from "@/lib/logic/widget";
import { useAppStore } from "@/lib/stores/appStore";
import { useTimeStore } from "@/lib/stores/timeStore";
import { resetDatabase } from "./mocks/db-connection";
import { insertHabit, insertTask } from "./helpers";
import { db } from "@/lib/db/connection";
import { habitCompletions } from "@/lib/db/schema";

const TODAY = "2024-08-10";

export async function run() {
  await testTodayCounts();
  await testDueTasksFirst();
  await testNextDayProjection();
  testRolloverAtUsesDayStart();
}

async function setUp() {
  resetDatabase();
  useTimeStore.setState({ currentDate: TODAY, isInitialized: true });
  useAppStore.setState({ isInitialized: true });
}

async function snapshotFromStore(dayStart = "04:00") {
  await useAppStore.getState().refreshData();
  const s = useAppStore.getState();
  return buildWidgetSnapshot({
    today: TODAY,
    dayStart,
    todayTasks: s.todayTasks,
    activeHabits: s.activeHabits,
    todaysHabitCompletions: s.todaysHabitCompletions,
    openTasks: s.slateTasks,
  });
}

async function testTodayCounts() {
  await setUp();
  const read = await insertHabit({ title: "Read" });
  await insertHabit({ title: "Stretch" });
  await insertHabit({ title: "Gone", isActive: false });
  await db.insert(habitCompletions).values({
    id: "c1",
    habitId: read.id,
    date: TODAY,
    completedAt: "2024-08-10T15:00:00.000Z",
  });
  await insertTask({ title: "Open", scheduledFor: TODAY });
  await insertTask({
    title: "Finished",
    scheduledFor: TODAY,
    status: "done",
    completedDate: TODAY,
  });
  await insertTask({ title: "On the slate" });

  const { today } = await snapshotFromStore();
  assert.strictEqual(today.date, TODAY);
  assert.strictEqual(today.habitsTotal, 2);
  assert.strictEqual(today.habitsDone, 1);
  assert.deepStrictEqual(today.pendingHabits, ["Stretch"]);
  assert.strictEqual(today.tasksTotal, 2);
  assert.strictEqual(today.tasksDone, 1);
  assert.deepStrictEqual(today.pendingTasks, [{ title: "Open", isDue: false }]);
}

async function testDueTasksFirst() {
  await setUp();
  await insertTask({ title: "Plain", scheduledFor: TODAY });
  await insertTask({ title: "Due today", scheduledFor: TODAY, dueDate: TODAY });
  await insertTask({ title: "Overdue", scheduledFor: TODAY, dueDate: "2024-08-08" });
  await insertTask({ title: "Due later", scheduledFor: TODAY, dueDate: "2024-08-20" });

  const { today } = await snapshotFromStore();
  assert.deepStrictEqual(
    today.pendingTasks.map((t) => [t.title, t.isDue]),
    [
      ["Overdue", true],
      ["Due today", true],
      ["Plain", false],
      ["Due later", false],
    ]
  );
}

async function testNextDayProjection() {
  await setUp();
  const read = await insertHabit({ title: "Read" });
  await db.insert(habitCompletions).values({
    id: "c1",
    habitId: read.id,
    date: TODAY,
    completedAt: "2024-08-10T15:00:00.000Z",
  });
  await insertTask({ title: "Carry over", scheduledFor: TODAY });
  await insertTask({
    title: "Done today",
    scheduledFor: TODAY,
    status: "done",
    completedDate: TODAY,
  });
  await insertTask({ title: "Planned tomorrow", scheduledFor: "2024-08-11" });
  await insertTask({ title: "Due tomorrow", dueDate: "2024-08-11" });
  await insertTask({ title: "Due next week", dueDate: "2024-08-17" });
  await insertTask({ title: "Someday" });

  const { next } = await snapshotFromStore();
  assert.strictEqual(next.date, "2024-08-11");
  assert.strictEqual(next.habitsDone, 0);
  assert.deepStrictEqual(next.pendingHabits, ["Read"]);
  assert.strictEqual(next.tasksDone, 0);
  assert.deepStrictEqual(
    next.pendingTasks.map((t) => t.title).sort(),
    ["Carry over", "Due tomorrow", "Planned tomorrow"]
  );
  assert.strictEqual(next.pendingTasks[0].title, "Due tomorrow");
  assert.strictEqual(next.tasksTotal, 3);
}

function testRolloverAtUsesDayStart() {
  const snapshot = buildWidgetSnapshot({
    today: TODAY,
    dayStart: "04:30",
    todayTasks: [],
    activeHabits: [],
    todaysHabitCompletions: [],
    openTasks: [],
  });
  // Local time, like getToday()
  assert.strictEqual(
    dayjs(snapshot.rolloverAt).format("YYYY-MM-DD HH:mm"),
    "2024-08-11 04:30"
  );
}
