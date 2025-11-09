import * as repo from "@/lib/logic/repo";

import { addDays, getToday } from "@/lib/logic/dates";

import { create } from "zustand";
import { useSettingsStore } from "./settings";

type Task = repo.Task;
type Habit = repo.Habit;
type HabitCompletion = repo.HabitCompletion;

interface AppState {
  isInitialized: boolean;
  todayDate: string;
  syncTodayDate: () => string;

  // Data for "Today" screen
  todayTasks: Task[];
  activeHabits: Habit[];
  todaysHabitCompletions: HabitCompletion[];

  // Data for "Slate" screen
  slateTasks: Task[];
  overdueTasks: Task[];

  // Actions
  init: () => Promise<void>;
  refreshData: () => Promise<void>;
  setToday: (date: string) => Promise<void>;
  createTask: (data: {
    title: string;
    notes?: string;
    dueDate?: string;
    scheduledFor?: string;
    dependsOn?: string;
  }) => Promise<void>;
  createHabit: (data: { title: string; notes?: string }) => Promise<void>;
  updateTask: (
    id: string,
    data: {
      title?: string;
      notes?: string;
      dueDate?: string;
      scheduledFor?: string;
      dependsOn?: string;
    }
  ) => Promise<void>;
  updateHabit: (
    id: string,
    data: {
      title?: string;
      notes?: string;
    }
  ) => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
  getHabitById: (id: string) => Habit | undefined;
  planTaskForToday: (taskId: string) => Promise<void>;
  sendTaskBackToSlate: (taskId: string) => Promise<void>;
  skipTaskForToday: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  undoCompleteTask: (taskId: string) => Promise<void>;
  completeHabit: (habitId: string) => Promise<void>;
  undoHabit: (habitId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  isInitialized: false,
  todayDate: getToday(useSettingsStore.getState().dayStart),
  syncTodayDate: () => {
    const computedToday = getToday(useSettingsStore.getState().dayStart);
    const currentToday = get().todayDate;
    if (currentToday !== computedToday) {
      set({ todayDate: computedToday });
    }
    return computedToday;
  },
  todayTasks: [],
  activeHabits: [],
  todaysHabitCompletions: [],
  slateTasks: [],
  overdueTasks: [],

  init: async () => {
    const today = get().syncTodayDate();
    set({ todayDate: today, isInitialized: true });
    await get().refreshData();
  },

  refreshData: async () => {
    const today = get().syncTodayDate();
    const [todayTasks, activeHabits, completions, slateTasks, overdueTasks] =
      await Promise.all([
        repo.listTodayTasks(today),
        repo.listActiveHabits(),
        repo.getHabitCompletionsForDate(today),
        repo.listAllTasks(),
        repo.listOverdueTasks(today),
      ]);

    set({
      todayTasks,
      activeHabits,
      todaysHabitCompletions: completions,
      slateTasks,
      overdueTasks,
    });
  },

  setToday: async (date: string) => {
    set({ todayDate: date });
    await get().refreshData();
  },


  createTask: async (data) => {
    await repo.createTask(data);
    await get().refreshData();
  },

  createHabit: async (data) => {
    await repo.createHabit(data);
    await get().refreshData();
  },

  updateTask: async (id, data) => {
    await repo.updateTask(id, data);
    await get().refreshData();
  },

  updateHabit: async (id, data) => {
    await repo.updateHabit(id, data);
    await get().refreshData();
  },

  getTaskById: (id) => {
    return (
      get().todayTasks.find((t) => t.id === id) ||
      get().slateTasks.find((t) => t.id === id) ||
      get().overdueTasks.find((t) => t.id === id)
    );
  },

  getHabitById: (id) => {
    return get().activeHabits.find((h) => h.id === id);
  },

  planTaskForToday: async (taskId) => {
    const today = get().syncTodayDate();
    await repo.planTaskFor(taskId, today);
    await get().refreshData();
  },

  sendTaskBackToSlate: async (taskId) => {
    await repo.planTaskFor(taskId, null);
    await get().refreshData();
  },

  skipTaskForToday: async (taskId) => {
    const tomorrow = addDays(get().syncTodayDate(), 1);
    await repo.skipTaskForToday(taskId, tomorrow);
    await get().refreshData();
  },

  completeTask: async (taskId) => {
    await repo.completeTask(taskId);
    await get().refreshData();
  },

  undoCompleteTask: async (taskId) => {
    await repo.undoCompleteTask(taskId);
    await get().refreshData();
  },

  completeHabit: async (habitId) => {
    const today = get().syncTodayDate();
    await repo.completeHabitToday(habitId, today);
    await get().refreshData();
  },

  undoHabit: async (habitId) => {
    const today = get().syncTodayDate();
    await repo.undoHabitToday(habitId, today);
    await get().refreshData();
  },

  deleteTask: async (taskId) => {
    await repo.deleteTask(taskId);
    await get().refreshData();
  },

  deleteHabit: async (habitId) => {
    await repo.deleteHabit(habitId);
    await get().refreshData();
  },
}));

useSettingsStore.subscribe(
  (state) => state.dayStart,
  () => {
    const appState = useAppStore.getState();
    appState.syncTodayDate();
    if (appState.isInitialized) {
      appState.refreshData();
    }
  }
);
