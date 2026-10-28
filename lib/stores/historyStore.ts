import * as repo from "@/lib/logic/repo";

import {
  habitHistory,
  HabitHistory,
  taskHistory,
  TaskHistory,
} from "@/lib/db/schema";
import { and, count, eq, gte, lt, lte } from "drizzle-orm";

import { db } from "@/lib/db/connection";
import { addDays } from "@/lib/logic/dates";
import { calculateBaseStreaks, displayStreak } from "@/lib/logic/streaks";
import { create } from "zustand";
import { useTimeStore } from "./timeStore";

interface HistoryState {
  loading: boolean;
  hasLoaded: boolean;
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
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  loading: false,
  hasLoaded: false,
  calendarData: {},
  overallStats: {
    tasksCompleted7d: 0,
    perfectDays: 0,
    currentStreaks: {},
  },

  loadInitialData: async () => {
    set({ loading: true });
    try {
      // Last 7 days = 6 finalized days from history + today's live data
      const today = useTimeStore.getState().getCurrentDate();
      const windowStart = addDays(today, -6);

      const [pastTasksCompleted, pastHabitRows, todaySnapshot] =
        await Promise.all([
          db
            .select({ count: count() })
            .from(taskHistory)
            .where(
              and(
                gte(taskHistory.date, windowStart),
                lt(taskHistory.date, today),
                eq(taskHistory.completed, true)
              )
            )
            .then((result) => result[0]?.count || 0),
          db
            .select({
              date: habitHistory.date,
              completed: habitHistory.completed,
            })
            .from(habitHistory)
            .where(
              and(gte(habitHistory.date, windowStart), lt(habitHistory.date, today))
            ),
          repo.getDaySnapshot(today, today),
        ]);

      const tasksCompleted7d =
        pastTasksCompleted +
        todaySnapshot.tasks.filter((t) => t.isCompleted).length;

      // Group by date and count perfect days
      const habitDataByDate: Record<string, boolean[]> = {};
      pastHabitRows.forEach((record) => {
        if (!habitDataByDate[record.date]) habitDataByDate[record.date] = [];
        habitDataByDate[record.date].push(record.completed);
      });

      const perfectDays =
        Object.values(habitDataByDate).filter(
          (habits) => habits.length > 0 && habits.every((completed) => completed)
        ).length + (todaySnapshot.isPerfectDay ? 1 : 0);

      // Current streaks: finalized streak through yesterday, +1 if done today
      const baseStreaks = await calculateBaseStreaks(
        todaySnapshot.habits.map((h) => h.habit.id),
        today
      );
      const currentStreaks: Record<string, { streak: number; title: string }> =
        {};
      for (const { habit, isCompleted } of todaySnapshot.habits) {
        currentStreaks[habit.id] = {
          streak: displayStreak(baseStreaks[habit.id] ?? 0, isCompleted),
          title: habit.title,
        };
      }

      set({
        overallStats: {
          tasksCompleted7d,
          perfectDays,
          currentStreaks,
        },
        loading: false,
        hasLoaded: true,
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
      const dates = new Set([
        ...Object.keys(habitByDate),
        ...Object.keys(taskByDate),
      ]);
      dates.forEach((date) => {
        // Skip today if we already set it from live data
        if (date === today && isTodayInMonth) return;

        const habitsCompleted = (habitByDate[date] ?? []).filter(Boolean).length;
        const totalHabits = habitByDate[date]?.length ?? 0;
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
}));
