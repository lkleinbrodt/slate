import assert from "assert";

import { useAppStore } from "@/lib/stores/appStore";
import { useSettingsStore } from "@/lib/stores/settings";
import { state as repoState } from "@/lib/logic/repo";
import { addDays, getToday, setMockToday } from "@/lib/logic/dates";

function resetRepoState() {
  repoState.todayTasks = [];
  repoState.activeHabits = [];
  repoState.completions = [];
  repoState.slateTasks = [];
  repoState.overdueTasks = [];
  repoState.planTaskForCalls.length = 0;
  repoState.skipTaskForTodayCalls.length = 0;
  repoState.completeHabitTodayCalls.length = 0;
  repoState.undoHabitTodayCalls.length = 0;
  delete repoState.lastListTodayDate;
  delete repoState.lastCompletionsDate;
  delete repoState.lastOverdueDate;
}

function resetStores(initialDay: string) {
  resetRepoState();
  setMockToday(initialDay);
  useSettingsStore.setState({ dayStart: "04:00", loading: false });
  useAppStore.setState({
    isInitialized: false,
    todayDate: getToday("04:00"),
    todayTasks: [],
    activeHabits: [],
    todaysHabitCompletions: [],
    slateTasks: [],
    overdueTasks: [],
  });
}

export async function run() {
  await testRefreshDataRecomputesToday();
  await testPlanTaskUsesUpdatedToday();
  await testSkipTaskUsesTomorrow();
  await testHabitActionsUseUpdatedToday();
}

async function testRefreshDataRecomputesToday() {
  resetStores("2024-06-01");
  await useAppStore.getState().refreshData();
  assert.strictEqual(repoState.lastListTodayDate, "2024-06-01");
  assert.strictEqual(repoState.lastCompletionsDate, "2024-06-01");
  assert.strictEqual(repoState.lastOverdueDate, "2024-06-01");
  assert.strictEqual(useAppStore.getState().todayDate, "2024-06-01");

  setMockToday("2024-06-02");
  await useAppStore.getState().refreshData();
  assert.strictEqual(repoState.lastListTodayDate, "2024-06-02");
  assert.strictEqual(repoState.lastCompletionsDate, "2024-06-02");
  assert.strictEqual(repoState.lastOverdueDate, "2024-06-02");
  assert.strictEqual(useAppStore.getState().todayDate, "2024-06-02");
}

async function testPlanTaskUsesUpdatedToday() {
  resetStores("2024-07-01");
  await useAppStore.getState().planTaskForToday("task-1");
  assert.deepStrictEqual(repoState.planTaskForCalls, [
    { id: "task-1", date: "2024-07-01" },
  ]);

  setMockToday("2024-07-02");
  await useAppStore.getState().planTaskForToday("task-2");
  assert.deepStrictEqual(repoState.planTaskForCalls, [
    { id: "task-1", date: "2024-07-01" },
    { id: "task-2", date: "2024-07-02" },
  ]);
}

async function testSkipTaskUsesTomorrow() {
  resetStores("2024-08-10");
  await useAppStore.getState().skipTaskForToday("task-3");
  assert.deepStrictEqual(repoState.skipTaskForTodayCalls, [
    { id: "task-3", date: addDays("2024-08-10", 1) },
  ]);
}

async function testHabitActionsUseUpdatedToday() {
  resetStores("2024-09-15");
  await useAppStore.getState().completeHabit("habit-1");
  await useAppStore.getState().undoHabit("habit-1");
  assert.deepStrictEqual(repoState.completeHabitTodayCalls, [
    { id: "habit-1", date: "2024-09-15" },
  ]);
  assert.deepStrictEqual(repoState.undoHabitTodayCalls, [
    { id: "habit-1", date: "2024-09-15" },
  ]);

  setMockToday("2024-09-16");
  await useAppStore.getState().completeHabit("habit-2");
  assert.deepStrictEqual(repoState.completeHabitTodayCalls, [
    { id: "habit-1", date: "2024-09-15" },
    { id: "habit-2", date: "2024-09-16" },
  ]);
}
