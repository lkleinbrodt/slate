import assert from "assert";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/connection";
import { resetDatabase } from "./mocks/db-connection";
import { tasks } from "@/lib/db/schema";
import { useAppStore } from "@/lib/stores/appStore";
import { useTimeStore } from "@/lib/stores/timeStore";
import { calls } from "./mocks/notifications";
import { insertTask } from "./helpers";

export async function run() {
  await testCompleteTaskRecordsAppDay();
  await testUpdateTaskClearsAndSavesFields();
  await testPastDoDateClampedToToday();
  await testPlanTaskUsesCurrentDate();
  await testDueTasksGoToToday();
  await testCreateTaskReturnsWhereItLanded();
  await testHabitChangesRefreshReminders();
}

function setToday(date: string) {
  resetDatabase();
  useTimeStore.setState({ currentDate: date, isInitialized: true });
  useAppStore.setState({ isInitialized: true });
}

async function getTask(id: string) {
  return db.select().from(tasks).where(eq(tasks.id, id)).get();
}

async function testCompleteTaskRecordsAppDay() {
  setToday("2024-08-10");
  const task = await insertTask({ scheduledFor: "2024-08-10" });
  await useAppStore.getState().refreshData();

  useAppStore.getState().toggleTask(task.id);
  // toggleTask persists in the background; let it settle
  await new Promise((resolve) => setTimeout(resolve, 20));

  const saved = await getTask(task.id);
  assert.strictEqual(saved?.status, "done");
  assert.strictEqual(saved?.completedDate, "2024-08-10");

  await useAppStore.getState().undoCompleteTask(task.id);
  const undone = await getTask(task.id);
  assert.strictEqual(undone?.status, "open");
  assert.strictEqual(undone?.completedDate, null);
}

async function testUpdateTaskClearsAndSavesFields() {
  setToday("2024-08-10");
  const blocker = await insertTask({ title: "Blocker" });
  const task = await insertTask({
    scheduledFor: "2024-08-12",
    dueDate: "2024-08-20",
  });

  await useAppStore.getState().updateTask(task.id, {
    title: "Renamed",
    scheduledFor: null,
    dueDate: null,
    dependsOnTaskId: blocker.id,
  });

  const saved = await getTask(task.id);
  assert.strictEqual(saved?.title, "Renamed");
  assert.strictEqual(saved?.scheduledFor, null, "do-date can be cleared");
  assert.strictEqual(saved?.dueDate, null, "due date can be cleared");
  assert.strictEqual(saved?.dependsOnTaskId, blocker.id, "dependency is saved");
}

async function testPastDoDateClampedToToday() {
  setToday("2024-08-10");
  await useAppStore
    .getState()
    .createTask({ title: "Backdated", scheduledFor: "2024-08-01" });

  const [created] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.title, "Backdated"));
  assert.strictEqual(created.scheduledFor, "2024-08-10");
}

async function testPlanTaskUsesCurrentDate() {
  setToday("2024-09-15");
  const task = await insertTask();
  await useAppStore.getState().planTaskForToday(task.id);
  assert.strictEqual((await getTask(task.id))?.scheduledFor, "2024-09-15");
  assert.deepStrictEqual(
    useAppStore.getState().todayTasks.map((t) => t.id),
    [task.id]
  );

  // The date moving on is picked up without recreating the store
  useTimeStore.setState({ currentDate: "2024-09-16" });
  const other = await insertTask();
  await useAppStore.getState().planTaskForToday(other.id);
  assert.strictEqual((await getTask(other.id))?.scheduledFor, "2024-09-16");
}

async function testDueTasksGoToToday() {
  setToday("2024-10-01");
  const store = useAppStore.getState();

  await store.createTask({ title: "Due now", dueDate: "2024-09-30" });
  const [created] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.title, "Due now"));
  assert.strictEqual(created.scheduledFor, "2024-10-01", "new due task -> Today");

  await store.sendTaskBackToSlate(created.id);
  assert.strictEqual(
    (await getTask(created.id))?.scheduledFor,
    null,
    "sending a due task back to the Slate sticks"
  );

  // Editing other fields (same due date) leaves it in the Slate
  await store.updateTask(created.id, {
    title: "Due now!",
    dueDate: "2024-09-30",
    scheduledFor: null,
  });
  assert.strictEqual((await getTask(created.id))?.scheduledFor, null);

  // Changing the due date to today pulls an unplanned task in
  const later = await insertTask({ dueDate: "2024-10-09" });
  await store.updateTask(later.id, { dueDate: "2024-10-01" });
  assert.strictEqual((await getTask(later.id))?.scheduledFor, "2024-10-01");
}

async function testCreateTaskReturnsWhereItLanded() {
  setToday("2024-11-05");
  const store = useAppStore.getState();

  const plain = await store.createTask({ title: "Plain" });
  assert.strictEqual(plain.scheduledFor, null, "no dates -> Slate");

  const due = await store.createTask({ title: "Due", dueDate: "2024-11-05" });
  assert.strictEqual(due.scheduledFor, "2024-11-05", "due today -> Today");

  const later = await store.createTask({
    title: "Later",
    scheduledFor: "2024-11-08",
  });
  assert.strictEqual(later.scheduledFor, "2024-11-08");
  assert.strictEqual((await getTask(due.id))?.scheduledFor, "2024-11-05");
}

// Reminder counts depend on which habits exist, not just which are done
async function testHabitChangesRefreshReminders() {
  setToday("2024-11-05");
  const store = useAppStore.getState();

  const before = calls.updateHabitReminders;
  await store.createHabit({ title: "Stretch" });
  assert.strictEqual(calls.updateHabitReminders, before + 1, "on create");

  const habit = useAppStore.getState().activeHabits[0];
  await store.deleteHabit(habit.id);
  assert.strictEqual(calls.updateHabitReminders, before + 2, "on delete");
}
