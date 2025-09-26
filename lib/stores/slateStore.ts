import * as dal from "@/lib/db/dal";

import { File, Paths } from "expo-file-system";

import type { Event } from "@/lib/db/schema";
import { create } from "zustand";
import { randomUUID } from "expo-crypto";

export interface Task {
  id: string;
  title: string;
  notes?: string;
  dueDate?: Date | null;
  isToday: boolean;
  isDone: boolean;
  createdAt: Date;
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  isDoneToday: boolean;
  createdAt: Date;
}

interface SlateState {
  isInitialized: boolean;
  tasks: Task[];
  habits: Habit[];
}

interface SlateActions {
  init: () => Promise<void>;
  takeSnapshot: () => Promise<void>;
  createTask: (
    title: string,
    notes?: string,
    dueDate?: Date | null
  ) => Promise<void>;
  updateTask: (
    taskId: string,
    updates: Partial<Omit<Task, "id">>
  ) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskForToday: (taskId: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  createHabit: (title: string) => Promise<void>;
  updateHabit: (
    habitId: string,
    updates: Partial<Omit<Habit, "id">>
  ) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleHabitCompletion: (habitId: string) => Promise<void>;
}

const initialState: SlateState = {
  isInitialized: false,
  tasks: [],
  habits: [],
};

interface Snapshot {
  lastEventId: number;
  state: SlateState;
}
const snapshotFile = new File(Paths.cache, "snapshot.json");

function slateReducer(state: SlateState, event: Event): SlateState {
  switch (event.type) {
    case "TASK_CREATED": {
      const { id, title, notes, dueDate, createdAt } = event.payload as any;
      const newTask: Task = {
        id,
        title,
        notes,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdAt: new Date(createdAt),
        isToday: false,
        isDone: false,
      };
      return { ...state, tasks: [...state.tasks, newTask] };
    }
    case "TASK_UPDATED": {
      const { taskId, updates } = event.payload as any;
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...(updates as any) } : task
        ),
      };
    }
    case "TASK_DELETED": {
      const { taskId } = event.payload as any;
      return { ...state, tasks: state.tasks.filter((t) => t.id !== taskId) };
    }
    case "TASK_TOGGLED_TODAY": {
      const { taskId } = event.payload as any;
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, isToday: !task.isToday } : task
        ),
      };
    }
    case "TASK_TOGGLED_DONE": {
      const { taskId } = event.payload as any;
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, isDone: !task.isDone } : task
        ),
      };
    }
    case "HABIT_CREATED": {
      const { id, title, createdAt } = event.payload as any;
      const habit: Habit = {
        id,
        title,
        createdAt: new Date(createdAt),
        isDoneToday: false,
        streak: 0,
      };
      return { ...state, habits: [...state.habits, habit] };
    }
    case "HABIT_UPDATED": {
      const { habitId, updates } = event.payload as any;
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === habitId ? { ...h, ...(updates as any) } : h
        ),
      };
    }
    case "HABIT_DELETED": {
      const { habitId } = event.payload as any;
      return { ...state, habits: state.habits.filter((h) => h.id !== habitId) };
    }
    case "HABIT_TOGGLED_TODAY": {
      const { habitId } = event.payload as any;
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === habitId ? { ...h, isDoneToday: !h.isDoneToday } : h
        ),
      };
    }
    default:
      return state;
  }
}

export const useSlateStore = create<SlateState & { actions: SlateActions }>(
  (set, get) => ({
    ...initialState,
    actions: {
      init: async () => {
        if (get().isInitialized) return;
        let finalState: SlateState = initialState;
        try {
          if (snapshotFile.exists) {
            const json = snapshotFile.textSync();
            const snapshot = JSON.parse(json) as Snapshot;
            const recent = await dal.getEventsSince(snapshot.lastEventId);
            finalState = recent.reduce(slateReducer, snapshot.state);
          } else {
            const all = await dal.getAllEvents();
            finalState = all.reduce(slateReducer, initialState);
          }
        } catch {
          const all = await dal.getAllEvents();
          finalState = all.reduce(slateReducer, initialState);
        }
        set({ ...finalState, isInitialized: true });
      },
      takeSnapshot: async () => {
        const all = await dal.getAllEvents();
        if (all.length === 0) return;
        const lastEventId = all[all.length - 1].id as number;
        const current = get();
        const snapshot: Snapshot = {
          lastEventId,
          state: {
            isInitialized: current.isInitialized,
            tasks: current.tasks,
            habits: current.habits,
          },
        };
        snapshotFile.write(JSON.stringify(snapshot));
      },
      createTask: async (title, notes, dueDate) => {
        const event = {
          type: "TASK_CREATED",
          payload: {
            id: randomUUID(),
            title,
            notes,
            dueDate,
            createdAt: new Date(),
          },
        } as const;
        await dal.addEvent(event as any);
        set((state) => slateReducer(state, event as any));
      },
      updateTask: async (taskId, updates) => {
        const event = {
          type: "TASK_UPDATED",
          payload: { taskId, updates },
        } as const;
        await dal.addEvent(event as any);
        set((state) => slateReducer(state, event as any));
      },
      deleteTask: async (taskId) => {
        try {
          console.log("Deleting task:", taskId);
          const event = { type: "TASK_DELETED", payload: { taskId } } as const;
          await dal.addEvent(event as any);
          console.log("Event added to database, updating state");

          // Get current state and apply the reducer
          const currentState = get();
          const newState = slateReducer(currentState, event as any);
          console.log("State updated, tasks count:", newState.tasks.length);

          // Update state directly
          set(newState);
          console.log("Task deletion completed");
        } catch (error) {
          console.error("Failed to delete task:", error);
          throw error; // Re-throw to be handled by the calling code
        }
      },
      toggleTaskForToday: async (taskId) => {
        const event = {
          type: "TASK_TOGGLED_TODAY",
          payload: { taskId },
        } as const;
        await dal.addEvent(event as any);
        set((state) => slateReducer(state, event as any));
      },
      toggleTaskCompletion: async (taskId) => {
        const event = {
          type: "TASK_TOGGLED_DONE",
          payload: { taskId },
        } as const;
        await dal.addEvent(event as any);
        set((state) => slateReducer(state, event as any));
      },
      createHabit: async (title) => {
        const event = {
          type: "HABIT_CREATED",
          payload: { id: randomUUID(), title, createdAt: new Date() },
        } as const;
        await dal.addEvent(event as any);
        set((state) => slateReducer(state, event as any));
      },
      updateHabit: async (habitId, updates) => {
        const event = {
          type: "HABIT_UPDATED",
          payload: { habitId, updates },
        } as const;
        await dal.addEvent(event as any);
        set((state) => slateReducer(state, event as any));
      },
      deleteHabit: async (habitId) => {
        const event = { type: "HABIT_DELETED", payload: { habitId } } as const;
        await dal.addEvent(event as any);
        set((state) => slateReducer(state, event as any));
      },
      toggleHabitCompletion: async (habitId) => {
        const event = {
          type: "HABIT_TOGGLED_TODAY",
          payload: { habitId },
        } as const;
        await dal.addEvent(event as any);
        set((state) => slateReducer(state, event as any));
      },
    },
  })
);
