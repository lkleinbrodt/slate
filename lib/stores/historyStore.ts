import * as repo from "@/lib/logic/repo";

import { habitHistory, taskHistory } from "@/lib/db/schema";
import { calculateStreak, isPerfectDay } from "@/lib/logic/streaks";
import { and, count, eq, gte, lte } from "drizzle-orm";

import { db } from "@/lib/db/connection";
import { getToday } from "@/lib/logic/dates";
import { create } from "zustand";
import { useSettingsStore } from "./settings";

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
    tasks: any[];
    habits: any[];
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
      const dayStart = useSettingsStore.getState().dayStart;
      const today = getToday(dayStart);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

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
        .then((result: any) => result[0]?.count || 0);

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
      perfectDaysResult.forEach((record: any) => {
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

      habitData.forEach((record: any) => {
        if (!habitByDate[record.date]) habitByDate[record.date] = [];
        habitByDate[record.date].push(record.completed);
      });

      taskData.forEach((record: any) => {
        if (!taskByDate[record.date]) taskByDate[record.date] = [];
        taskByDate[record.date].push(record.completed);
      });

      // Calculate metrics for each date
      Object.keys(habitByDate).forEach((date) => {
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
      const [tasks, habits] = await Promise.all([
        repo.getDayTasksHistory(date),
        repo.getDayHabitsHistory(date),
      ]);

      const perfectDay = await isPerfectDay(date);

      return {
        tasks,
        habits,
        isPerfectDay: perfectDay,
      };
    } catch (error) {
      console.error("Failed to get day details:", error);
      return { tasks: [], habits: [], isPerfectDay: false };
    }
  },
}));
