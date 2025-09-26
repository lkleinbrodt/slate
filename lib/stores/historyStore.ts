/**
 * History store that derives data from the event log
 * This replaces the old historyStore with event-sourced data
 */

import { create } from "zustand";
import { localToday } from "../utils/clock";
import { useSlateStore } from "./slateStore";

export interface DayDetails {
  date: string;
  tasks: any[];
  habits: any[];
  completedTasks: any[];
  completedHabits: any[];
  perfectDay: boolean;
}

interface HistoryState {
  loading: boolean;
  selectedDay: DayDetails | null;
  stats: {
    tasksCompletedLast7Days: number;
    perfectDayCount: number;
  };
  calendarData: Record<string, any>;
  earliestDate: string | null;
  currentDate: string;
}

interface HistoryActions {
  loadInitialData: () => Promise<void>;
  loadCalendarDataForMonth: (month: string) => Promise<void>;
  selectDay: (date: string) => void;
  clearSelectedDay: () => void;
}

const initialState: HistoryState = {
  loading: true,
  selectedDay: null,
  stats: {
    tasksCompletedLast7Days: 0,
    perfectDayCount: 0,
  },
  calendarData: {},
  earliestDate: null,
  currentDate: localToday("04:00"),
};

export const useHistoryStore = create<
  HistoryState & { actions: HistoryActions }
>((set, get) => ({
  ...initialState,
  actions: {
    loadInitialData: async () => {
      set({ loading: true });

      // Get data from the unified store
      const { tasks, habits, isInitialized } = useSlateStore.getState();

      if (!isInitialized) {
        // Wait for initialization
        setTimeout(() => get().actions.loadInitialData(), 100);
        return;
      }

      // Calculate basic stats from current data
      const today = localToday("04:00");
      const completedTasks = tasks.filter((t) => t.isDone);
      const completedHabits = habits.filter((h) => h.isDoneToday);

      // For now, we'll use simplified calculations
      // In a full implementation, we'd replay events to get historical data
      const stats = {
        tasksCompletedLast7Days: completedTasks.length,
        perfectDayCount: completedHabits.length === habits.length ? 1 : 0,
      };

      set({
        loading: false,
        stats,
        currentDate: today,
      });
    },

    loadCalendarDataForMonth: async (month: string) => {
      // For now, we'll use the current day's data
      // In a full implementation, we'd replay events for the specific month
      const { tasks, habits } = useSlateStore.getState();

      const calendarData: Record<string, any> = {};
      const today = localToday("04:00");

      // Create a simple calendar entry for today
      calendarData[today] = {
        completedTasks: tasks.filter((t) => t.isDone).length,
        totalHabits: habits.length,
        completedHabits: habits.filter((h) => h.isDoneToday).length,
      };

      set({ calendarData });
    },

    selectDay: (date: string) => {
      const { tasks, habits } = useSlateStore.getState();

      // Create a day details object from current data
      // In a full implementation, we'd replay events for the specific date
      const dayDetails: DayDetails = {
        date,
        tasks: tasks.filter((t) => t.isToday),
        habits,
        completedTasks: tasks.filter((t) => t.isDone),
        completedHabits: habits.filter((h) => h.isDoneToday),
        perfectDay: habits.every((h) => h.isDoneToday),
      };

      set({ selectedDay: dayDetails });
    },

    clearSelectedDay: () => {
      set({ selectedDay: null });
    },
  },
}));
