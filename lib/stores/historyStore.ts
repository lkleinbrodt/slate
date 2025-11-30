import * as repo from "@/lib/logic/repo";

import {
  habitHistory,
  HabitHistory,
  taskHistory,
  TaskHistory,
} from "@/lib/db/schema";
import { and, count, eq, gte, lte } from "drizzle-orm";

import { db } from "@/lib/db/connection";
import { addDays } from "@/lib/logic/dates";
import { calculateStreak } from "@/lib/logic/streaks";
import { create } from "zustand";
import { useTimeStore } from "./timeStore";

interface HistoryState {
  loading: boolean;
  selectedDay: string | null;
  calendarData: Record<
    string,
    { isPerfectDay: boolean; tasksCompleted: number; habitsCompleted: number }
  >;
  overallStats: {
    tasksCompleted7d: number;
    perfectDays: number;
    currentStreaks: Record<string, { streak: number; title: string }>;
  };

  // Actions
  loadInitialData: () => Promise<void>;
  loadCalendarData: (month: string) => Promise<void>;
  selectDay: (date: string) => void;
  clearSelectedDay: () => void;
  getDayDetails: (date: string) => Promise<{
    tasks: {
      task_history: {
        id: string;
        date: string;
        taskId: string;
        planned: boolean;
        completed: boolean;
      };
      tasks: repo.Task;
    }[];
    habits: {
      habit_history: {
        id: string;
        date: string;
        habitId: string;
        completed: boolean;
      };
      habits: repo.Habit;
    }[];
    isPerfectDay: boolean;
  }>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  loading: false,
  selectedDay: null,
  calendarData: {},
  overallStats: {
    tasksCompleted7d: 0,
    perfectDays: 0,
    currentStreaks: {},
  },

  loadInitialData: async () => {
    set({ loading: true });
    try {
      // Load overall stats
      const today = useTimeStore.getState().getCurrentDate();
      const sevenDaysAgo = addDays(today, -7);

      console.log(
        "Loading history data for date range:",
        sevenDaysAgo,
        "to",
        today
      );

      // Get tasks completed in last 7 days
      const tasksCompleted7d = await db
        .select({ count: count() })
        .from(taskHistory)
        .where(
          and(
            gte(taskHistory.date, sevenDaysAgo),
            eq(taskHistory.completed, true)
          )
        )
        .then((result) => result[0]?.count || 0);

      // Get perfect days count - need to count unique dates where all habits were completed
      const perfectDaysResult = await db
        .select({
          date: habitHistory.date,
          completed: habitHistory.completed,
        })
        .from(habitHistory)
        .where(gte(habitHistory.date, sevenDaysAgo));

      // Group by date and count perfect days
      const habitDataByDate: Record<string, boolean[]> = {};
      perfectDaysResult.forEach((record) => {
        if (!habitDataByDate[record.date]) habitDataByDate[record.date] = [];
        habitDataByDate[record.date].push(record.completed);
      });

      const perfectDays = Object.values(habitDataByDate).filter(
        (habits) => habits.length > 0 && habits.every((completed) => completed)
      ).length;

      // Get current streaks for all habits
      const activeHabits = await repo.listActiveHabits();
      const currentStreaks: Record<string, { streak: number; title: string }> =
        {};
      for (const habit of activeHabits) {
        currentStreaks[habit.id] = {
          streak: await calculateStreak(habit.id, today),
          title: habit.title,
        };
      }

      console.log("History data loaded successfully:", {
        tasksCompleted7d,
        perfectDays,
        currentStreaksCount: Object.keys(currentStreaks).length,
      });

      set({
        overallStats: {
          tasksCompleted7d,
          perfectDays,
          currentStreaks,
        },
        loading: false,
      });
    } catch (error) {
      console.error("Failed to load initial history data:", error);
      set({
        loading: false,
        overallStats: {
          tasksCompleted7d: 0,
          perfectDays: 0,
          currentStreaks: {},
        },
      });
    }
  },

  loadCalendarData: async (month: string) => {
    try {
      // Load calendar data for the month
      const startOfMonth = `${month}-01`;
      const endOfMonth = `${month}-31`;
      const today = useTimeStore.getState().getCurrentDate();
      const isTodayInMonth =
        today >= startOfMonth && today <= endOfMonth;

      // Load history data for the month
      const habitData = await db
        .select()
        .from(habitHistory)
        .where(
          and(
            gte(habitHistory.date, startOfMonth),
            lte(habitHistory.date, endOfMonth)
          )
        );

      const taskData = await db
        .select()
        .from(taskHistory)
        .where(
          and(
            gte(taskHistory.date, startOfMonth),
            lte(taskHistory.date, endOfMonth)
          )
        );

      // Process data into calendar format
      const calendarData: Record<
        string,
        {
          isPerfectDay: boolean;
          tasksCompleted: number;
          habitsCompleted: number;
        }
      > = {};

      // Group by date
      const habitByDate: Record<string, boolean[]> = {};
      const taskByDate: Record<string, boolean[]> = {};

      habitData.forEach((record: HabitHistory) => {
        if (!habitByDate[record.date]) habitByDate[record.date] = [];
        habitByDate[record.date].push(record.completed);
      });

      taskData.forEach((record: TaskHistory) => {
        if (!taskByDate[record.date]) taskByDate[record.date] = [];
        taskByDate[record.date].push(record.completed);
      });

      // If today is in this month, merge today's live data
      if (isTodayInMonth) {
        const todaySnapshot = await repo.getDaySnapshot(today, today);
        const todayHabitsCompleted = todaySnapshot.habits.filter(
          (h) => h.isCompleted
        ).length;
        const todayTasksCompleted = todaySnapshot.tasks.filter(
          (t) => t.isCompleted
        ).length;

        // Override today's data with live data (this ensures today shows current progress)
        calendarData[today] = {
          isPerfectDay: todaySnapshot.isPerfectDay,
          tasksCompleted: todayTasksCompleted,
          habitsCompleted: todayHabitsCompleted,
        };
      }

      // Calculate metrics for each date (excluding today if it was already set)
      Object.keys(habitByDate).forEach((date) => {
        // Skip today if we already set it from live data
        if (date === today && isTodayInMonth) return;

        const habitsCompleted = habitByDate[date].filter(Boolean).length;
        const totalHabits = habitByDate[date].length;
        const isPerfectDay = habitsCompleted === totalHabits && totalHabits > 0;

        calendarData[date] = {
          isPerfectDay,
          tasksCompleted: taskByDate[date]?.filter(Boolean).length || 0,
          habitsCompleted,
        };
      });

      set({ calendarData: { ...get().calendarData, ...calendarData } });
    } catch (error) {
      console.error("Failed to load calendar data:", error);
    }
  },

  selectDay: (date: string) => {
    set({ selectedDay: date });
  },

  clearSelectedDay: () => {
    set({ selectedDay: null });
  },

  getDayDetails: async (date: string) => {
    try {
      const today = useTimeStore.getState().getCurrentDate();
      const snapshot = await repo.getDaySnapshot(date, today);

      // Transform to the format expected by existing components
      // (maintaining backward compatibility while using unified source)
      return {
        tasks: snapshot.tasks.map((item) => ({
          task_history: {
            id: `th-${item.task.id}-${date}`,
            date,
            taskId: item.task.id,
            planned: item.isPlanned,
            completed: item.isCompleted,
          },
          tasks: item.task,
        })),
        habits: snapshot.habits.map((item) => ({
          habit_history: {
            id: `hh-${item.habit.id}-${date}`,
            date,
            habitId: item.habit.id,
            completed: item.isCompleted,
          },
          habits: item.habit,
        })),
        isPerfectDay: snapshot.isPerfectDay,
      };
    } catch (error) {
      console.error("Failed to get day details:", error);
      return { tasks: [], habits: [], isPerfectDay: false };
    }
  },
}));
