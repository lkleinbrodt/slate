import * as repo from "@/lib/logic/repo";

import { addDays } from "@/lib/logic/dates";

import { create } from "zustand";
import { useTimeStore } from "./timeStore";
import { updateHabitRemindersIfNeeded } from "@/lib/services/notifications";

type Task = repo.Task;
type Habit = repo.Habit;
type HabitCompletion = repo.HabitCompletion;

interface AppState {
  isInitialized: boolean;
  // todayDate is now derived from TimeStore - use getTodayDate() instead

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
  getTodayDate: () => string; // Get current date from TimeStore
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
  toggleTask: (taskId: string) => void;
  toggleHabit: (habitId: string) => void;
  completeHabit: (habitId: string) => Promise<void>;
  undoHabit: (habitId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  isInitialized: false,
  todayTasks: [],
  activeHabits: [],
  todaysHabitCompletions: [],
  slateTasks: [],
  overdueTasks: [],

  init: async () => {
    set({ isInitialized: true });
    await get().refreshData();
  },

  refreshData: async () => {
    const today = get().getTodayDate();
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

  getTodayDate: () => {
    return useTimeStore.getState().getCurrentDate();
  },

  planTaskForToday: async (taskId) => {
    await repo.planTaskFor(taskId, get().getTodayDate());
    await get().refreshData();
  },

  sendTaskBackToSlate: async (taskId) => {
    await repo.planTaskFor(taskId, null);
    await get().refreshData();
  },

  skipTaskForToday: async (taskId) => {
    const tomorrow = addDays(get().getTodayDate(), 1);
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

  toggleTask: (taskId: string) => {
    // 1. SNAPSHOT: Get current state for rollback if needed
    const previousTasks = get().todayTasks;
    const currentTask = previousTasks.find((t) => t.id === taskId);
    if (!currentTask) return;

    const wasDone = currentTask.status === "done";
    const willBeDone = !wasDone;

    // 2. OPTIMISTIC UPDATE: Update UI immediately
    set((state) => ({
      todayTasks: state.todayTasks.map((t) =>
        t.id === taskId
          ? { ...t, status: willBeDone ? "done" : "open" } // Flip status
          : t
      ),
    }));

    // 3. PERSIST: Fire and forget DB update
    const promise = willBeDone
      ? repo.completeTask(taskId)
      : repo.undoCompleteTask(taskId);

    promise.catch((err) => {
      console.error("Task toggle failed", err);
      // Revert on error
      set({ todayTasks: previousTasks });
    });
  },

  toggleHabit: (habitId: string) => {
    // 1. SNAPSHOT: Get current state for rollback if needed
    const previousCompletions = get().todaysHabitCompletions;
    const today = get().getTodayDate();
    const isCompleted = previousCompletions.some((c) => c.habitId === habitId);

    // 2. OPTIMISTIC UPDATE: Update UI immediately
    if (isCompleted) {
      // Remove from completions
      set((state) => ({
        todaysHabitCompletions: state.todaysHabitCompletions.filter(
          (c) => c.habitId !== habitId
        ),
      }));
    } else {
      // Add to completions
      const newCompletion: HabitCompletion = {
        id: `temp-${habitId}-${Date.now()}`, // Temporary ID, will be replaced on refresh
        habitId,
        date: today,
        completedAt: new Date().toISOString(),
      };
      set((state) => ({
        todaysHabitCompletions: [...state.todaysHabitCompletions, newCompletion],
      }));
    }

    // 3. PERSIST: Fire and forget DB update
    const promise = isCompleted
      ? repo.undoHabitToday(habitId, today)
      : repo.completeHabitToday(habitId, today);

    promise
      .then(() => {
        // Update habit reminders if needed (only on success)
        updateHabitRemindersIfNeeded().catch((err) => {
          console.error("Failed to update habit reminders", err);
        });
      })
      .catch((err) => {
        console.error("Habit toggle failed", err);
        // Revert on error
        set({ todaysHabitCompletions: previousCompletions });
      });
  },

  completeHabit: async (habitId) => {
    await repo.completeHabitToday(habitId, get().getTodayDate());
    await get().refreshData();
    // Update habit reminders if needed
    await updateHabitRemindersIfNeeded();
  },

  undoHabit: async (habitId) => {
    await repo.undoHabitToday(habitId, get().getTodayDate());
    await get().refreshData();
    // Update habit reminders if needed
    await updateHabitRemindersIfNeeded();
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
