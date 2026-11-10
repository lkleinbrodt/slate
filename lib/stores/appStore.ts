import * as repo from "@/lib/logic/repo";

import { addDays } from "@/lib/logic/dates";
import { firstOccurrence, parseRule } from "@/lib/logic/repeat";
import { calculateBaseStreaks } from "@/lib/logic/streaks";

import { create } from "zustand";
import { syncTaskSoon } from "@/lib/services/calendarSync";
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
  // Consecutive completed days ending yesterday; add 1 if completed today
  habitBaseStreaks: Record<string, number>;

  // Data for "Slate" screen
  slateTasks: Task[];

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
    repeatRule?: string;
    durationMin?: number;
    // HH:mm on the do date; ignored without one
    startTime?: string;
  }) => Promise<Task>;
  createHabit: (data: { title: string; notes?: string }) => Promise<void>;
  // null clears a field; undefined leaves it unchanged
  updateTask: (
    id: string,
    data: {
      title?: string;
      notes?: string | null;
      dueDate?: string | null;
      scheduledFor?: string | null;
      dependsOnTaskId?: string | null;
      repeatRule?: string | null;
      durationMin?: number | null;
      // Moving the do date drops the slot unless a new one is given
      startTime?: string | null;
    }
  ) => Promise<void>;
  // Set or clear a task's time slot on its do date (lib/logic/schedule.ts)
  scheduleTask: (taskId: string, startTime: string | null, durationMin?: number) => Promise<void>;
  // Several slots at once, from "Fit these in"
  applySlots: (slots: { taskId: string; startTime: string; durationMin: number }[]) => Promise<void>;
  updateHabit: (
    id: string,
    data: {
      title?: string;
      notes?: string | null;
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
  deleteTask: (taskId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
}

// Incremented per refresh so out-of-order results can be discarded
let latestRefreshId = 0;

// A do-date in the past would never be picked up by rollover; treat it as today.
// Keeps undefined (= "leave unchanged") and null (= "clear") as-is.
function clampToToday<T extends string | null | undefined>(
  date: T,
  today: string
): T | string {
  return date && date < today ? today : date;
}

// Fire-and-forget: reminder counts depend on which habits exist and are done
function refreshHabitReminders() {
  updateHabitRemindersIfNeeded().catch((err) => {
    console.error("Failed to update habit reminders", err);
  });
}

// Tasks due today or earlier belong in Today (mirrors the morning pull-in in
// rollover), unless they're already planned for today or earlier.
function planIfDue(
  scheduledFor: string | null | undefined,
  dueDate: string | null | undefined,
  today: string
): string | null | undefined {
  const isDue = !!dueDate && dueDate <= today;
  const plannedByToday = !!scheduledFor && scheduledFor <= today;
  return isDue && !plannedByToday ? today : scheduledFor;
}

// A repeating task needs a due date to count as overdue once rollover carries it
// forward (rollover overwrites the do date), so default it to the do date.
function dueForRepeat(
  repeatRule: string | null | undefined,
  dueDate: string | null | undefined,
  scheduledFor: string | null | undefined
): string | null | undefined {
  return repeatRule && !dueDate && scheduledFor ? scheduledFor : dueDate;
}

export const useAppStore = create<AppState>((set, get) => ({
  isInitialized: false,
  todayTasks: [],
  activeHabits: [],
  todaysHabitCompletions: [],
  habitBaseStreaks: {},
  slateTasks: [],

  init: async () => {
    set({ isInitialized: true });
    await get().refreshData();
  },

  refreshData: async () => {
    const requestId = ++latestRefreshId;
    const today = get().getTodayDate();
    const [todayTasks, activeHabits, completions, slateTasks] =
      await Promise.all([
        repo.listTodayTasks(today),
        repo.listActiveHabits(),
        repo.getHabitCompletionsForDate(today),
        repo.listAllTasks(),
      ]);
    const habitBaseStreaks = await calculateBaseStreaks(
      activeHabits.map((h) => h.id),
      today
    );

    // A newer refresh started while this one was in flight; let it win
    if (requestId !== latestRefreshId) return;

    set({
      todayTasks,
      activeHabits,
      todaysHabitCompletions: completions,
      habitBaseStreaks,
      slateTasks,
    });
  },

  createTask: async (data) => {
    const today = get().getTodayDate();
    // A repeating task belongs on its first matching day, not in the Slate
    const rule = parseRule(data.repeatRule);
    const doDate = clampToToday(
      data.scheduledFor ?? (rule ? firstOccurrence(rule, today) : undefined),
      today
    );
    const dueDate =
      dueForRepeat(data.repeatRule, data.dueDate, doDate) ?? undefined;
    const scheduledFor = planIfDue(doDate, dueDate, today);
    const task = await repo.createTask({
      ...data,
      dueDate,
      scheduledFor: scheduledFor ?? undefined,
      startTime: scheduledFor ? data.startTime : undefined,
    });
    await get().refreshData();
    if (task.startTime) syncTaskSoon(task.id);
    return task;
  },

  createHabit: async (data) => {
    await repo.createHabit(data);
    await get().refreshData();
    refreshHabitReminders();
  },

  updateTask: async (id, data) => {
    const today = get().getTodayDate();
    let scheduledFor = clampToToday(data.scheduledFor, today);
    // Only when the due date is being changed, so sending a due task back to
    // the Slate (scheduledFor: null, same due date) still works
    const existing = await repo.getTask(id);
    if (data.dueDate !== undefined && data.dueDate !== existing?.dueDate) {
      scheduledFor = planIfDue(
        scheduledFor === undefined ? existing?.scheduledFor : scheduledFor,
        data.dueDate,
        today
      );
    }
    const repeat =
      data.repeatRule === undefined ? existing?.repeatRule : data.repeatRule;
    const rule = parseRule(repeat);
    if (rule && (scheduledFor === undefined ? existing?.scheduledFor : scheduledFor) == null) {
      scheduledFor = firstOccurrence(rule, today);
    }
    const dueDate = dueForRepeat(
      repeat,
      data.dueDate === undefined ? existing?.dueDate : data.dueDate,
      scheduledFor === undefined ? existing?.scheduledFor : scheduledFor
    );
    const finalDate = scheduledFor === undefined ? existing?.scheduledFor : scheduledFor;
    const startTime =
      data.startTime === undefined && finalDate !== existing?.scheduledFor ? null : data.startTime;
    await repo.updateTask(id, {
      ...data,
      scheduledFor,
      startTime: finalDate ? startTime : null,
      dueDate: data.dueDate === undefined && dueDate === existing?.dueDate ? undefined : dueDate,
    });
    await get().refreshData();
    syncTaskSoon(id);
  },

  scheduleTask: async (taskId, startTime, durationMin) => {
    await repo.updateTask(taskId, { startTime, durationMin });
    await get().refreshData();
    syncTaskSoon(taskId);
  },

  applySlots: async (slots) => {
    for (const slot of slots) {
      await repo.updateTask(slot.taskId, {
        startTime: slot.startTime,
        durationMin: slot.durationMin,
      });
    }
    await get().refreshData();
    slots.forEach((slot) => syncTaskSoon(slot.taskId));
  },

  updateHabit: async (id, data) => {
    await repo.updateHabit(id, data);
    await get().refreshData();
  },

  getTaskById: (id) => {
    return (
      get().todayTasks.find((t) => t.id === id) ||
      get().slateTasks.find((t) => t.id === id)
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
    syncTaskSoon(taskId);
  },

  sendTaskBackToSlate: async (taskId) => {
    await repo.planTaskFor(taskId, null);
    await get().refreshData();
    syncTaskSoon(taskId);
  },

  skipTaskForToday: async (taskId) => {
    const tomorrow = addDays(get().getTodayDate(), 1);
    await repo.skipTaskForToday(taskId, tomorrow);
    await get().refreshData();
    syncTaskSoon(taskId);
  },

  completeTask: async (taskId) => {
    await repo.completeTask(taskId, get().getTodayDate());
    await get().refreshData();
    syncTaskSoon(taskId);
  },

  undoCompleteTask: async (taskId) => {
    await repo.undoCompleteTask(taskId);
    await get().refreshData();
    syncTaskSoon(taskId);
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

    // 3. PERSIST: Fire and forget DB update, then resync (Slate list, timestamps)
    const promise = willBeDone
      ? repo.completeTask(taskId, get().getTodayDate())
      : repo.undoCompleteTask(taskId);

    promise
      .then(() => {
        syncTaskSoon(taskId);
        return get().refreshData();
      })
      .catch((err) => {
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
      .then(refreshHabitReminders)
      .catch((err) => {
        console.error("Habit toggle failed", err);
        // Revert on error
        set({ todaysHabitCompletions: previousCompletions });
      });
  },

  deleteTask: async (taskId) => {
    await repo.deleteTask(taskId);
    await get().refreshData();
    syncTaskSoon(taskId);
  },

  deleteHabit: async (habitId) => {
    await repo.deleteHabit(habitId);
    await get().refreshData();
    refreshHabitReminders();
  },
}));
