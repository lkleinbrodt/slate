import {
  appSettings,
  habitCompletions,
  habitHistory,
  habits,
  taskHistory,
  tasks,
} from "@/lib/db/schema";
import { and, eq, isNull, or, sql } from "drizzle-orm";

import { db } from "@/lib/db/connection";
import { nowISO } from "@/lib/logic/dates";
import { randomUUID } from "expo-crypto";

// ====== Settings ======
export const getSetting = async (key: string): Promise<string | null> => {
  const result = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .limit(1);
  return result[0]?.value ?? null;
};
export const setSetting = async (key: string, value: string): Promise<void> => {
  await db.insert(appSettings).values({ key, value }).onConflictDoUpdate({
    target: appSettings.key,
    set: { value },
  });
};

// ====== Tasks ======
export const listAllTasks = () =>
  db.select().from(tasks).where(eq(tasks.status, "open"));
export const listUnscheduledTasks = () =>
  db
    .select()
    .from(tasks)
    .where(and(eq(tasks.status, "open"), isNull(tasks.scheduledFor)));
export const listTodayTasks = (date: string) =>
  db
    .select()
    .from(tasks)
    .where(
      and(
        sql`status IN ('open', 'done')`,
        sql`(
          scheduled_for = ${date} 
          OR (status = 'done' AND date(completed_at) = ${date})
        )`
      )
    );
export const listOverdueTasks = (date: string) =>
  db
    .select()
    .from(tasks)
    .where(and(eq(tasks.status, "open"), sql`due_date < ${date}`));
export const getTask = (id: string) =>
  db.select().from(tasks).where(eq(tasks.id, id)).get();

export const createTask = async (data: {
  title: string;
  notes?: string;
  dueDate?: string;
  scheduledFor?: string;
  dependsOn?: string;
}) => {
  const now = nowISO();
  const newTask = {
    id: randomUUID(),
    title: data.title,
    notes: data.notes ?? null,
    dueDate: data.dueDate ?? null,
    scheduledFor: data.scheduledFor ?? null,
    dependsOnTaskId: data.dependsOn ?? null,
    createdAt: now,
    updatedAt: now,
    status: "open" as const,
    completedAt: null,
  };
  await db.insert(tasks).values(newTask);
  return newTask;
};

export const updateTask = async (
  id: string,
  data: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>
) => {
  await db
    .update(tasks)
    .set({ ...data, updatedAt: nowISO() })
    .where(eq(tasks.id, id));
  return getTask(id);
};

export const planTaskFor = (id: string, date: string | null) =>
  updateTask(id, { scheduledFor: date });
export const skipTaskForToday = (id: string, tomorrowDate: string) =>
  updateTask(id, { scheduledFor: tomorrowDate });
export const completeTask = (id: string) =>
  updateTask(id, { status: "done", completedAt: nowISO() });
export const undoCompleteTask = (id: string) =>
  updateTask(id, { status: "open", completedAt: null });

// Soft delete/archival for tasks
export const deleteTask = (id: string) =>
  updateTask(id, { status: "archived" });

// ====== Habits ======
export const listActiveHabits = () =>
  db.select().from(habits).where(eq(habits.isActive, true));
export const getHabit = (id: string) =>
  db.select().from(habits).where(eq(habits.id, id)).get();

export const createHabit = async (data: { title: string; notes?: string }) => {
  const now = nowISO();
  const newHabit = {
    id: randomUUID(),
    title: data.title,
    notes: data.notes ?? null,
    createdAt: now,
    updatedAt: now,
    isActive: true,
  };
  await db.insert(habits).values(newHabit);
  return newHabit;
};

export const updateHabit = async (
  id: string,
  data: Partial<Omit<Habit, "id" | "createdAt" | "updatedAt">>
) => {
  await db
    .update(habits)
    .set({ ...data, updatedAt: nowISO() })
    .where(eq(habits.id, id));
  return getHabit(id);
};

export const getHabitCompletionsForDate = (date: string) =>
  db.select().from(habitCompletions).where(eq(habitCompletions.date, date));

export const completeHabitToday = async (habitId: string, date: string) => {
  const newCompletion = {
    id: randomUUID(),
    habitId,
    date,
    completedAt: nowISO(),
  };
  await db.insert(habitCompletions).values(newCompletion).onConflictDoNothing();
  return newCompletion;
};

export const undoHabitToday = (habitId: string, date: string) =>
  db
    .delete(habitCompletions)
    .where(
      and(
        eq(habitCompletions.habitId, habitId),
        eq(habitCompletions.date, date)
      )
    );

// Soft delete/deactivate for habits
export const deleteHabit = (id: string) => updateHabit(id, { isActive: false });

// ====== History ======
export const getDayHabitsHistory = (date: string) =>
  db
    .select()
    .from(habitHistory)
    .leftJoin(habits, eq(habitHistory.habitId, habits.id))
    .where(eq(habitHistory.date, date));
export const getDayTasksHistory = (date: string) =>
  db
    .select()
    .from(taskHistory)
    .leftJoin(tasks, eq(taskHistory.taskId, tasks.id))
    .where(eq(taskHistory.date, date));

// ====== Unified Day Snapshot ======
/**
 * Unified interface for a day's snapshot - works for both today (live data) and history (immutable data)
 */
export interface DaySnapshotTask {
  task: Task;
  isCompleted: boolean;
  isPlanned: boolean;
}

export interface DaySnapshotHabit {
  habit: Habit;
  isCompleted: boolean;
}

export interface DaySnapshot {
  date: string;
  tasks: DaySnapshotTask[];
  habits: DaySnapshotHabit[];
  isPerfectDay: boolean;
}

/**
 * Get a unified snapshot of a day's state.
 * - If date === today: Queries live tables (tasks, habit_completions)
 * - If date < today: Queries history tables (task_history, habit_history)
 * Returns the same interface for both, making the UI agnostic to data source.
 * 
 * @param date - The date to get snapshot for (YYYY-MM-DD)
 * @param today - The current date (YYYY-MM-DD) - pass this to determine if querying live vs history
 */
export async function getDaySnapshot(
  date: string,
  today: string
): Promise<DaySnapshot> {
  const isToday = date === today;

  if (isToday) {
    // Query live data for today
    const [todayTasks, activeHabits, habitCompletions] = await Promise.all([
      listTodayTasks(date),
      listActiveHabits(),
      getHabitCompletionsForDate(date),
    ]);

    // Build completion lookup for habits
    const completionSet = new Set(
      habitCompletions.map((c) => c.habitId)
    );

    // Transform tasks to unified format
    const snapshotTasks: DaySnapshotTask[] = todayTasks.map((task) => ({
      task,
      isCompleted: task.status === "done",
      isPlanned: true, // All tasks in listTodayTasks are planned
    }));

    // Transform habits to unified format
    const snapshotHabits: DaySnapshotHabit[] = activeHabits.map((habit) => ({
      habit,
      isCompleted: completionSet.has(habit.id),
    }));

    // Calculate perfect day: all active habits must be completed
    const isPerfectDay =
      activeHabits.length > 0 &&
      activeHabits.every((h) => completionSet.has(h.id));

    return {
      date,
      tasks: snapshotTasks,
      habits: snapshotHabits,
      isPerfectDay,
    };
  } else {
    // Query history data for past dates
    const [historyTasks, historyHabits] = await Promise.all([
      getDayTasksHistory(date),
      getDayHabitsHistory(date),
    ]);

    // Transform history tasks to unified format
    const snapshotTasks: DaySnapshotTask[] = historyTasks
      .filter((row) => row.tasks !== null) // Filter out deleted tasks
      .map((row) => ({
        task: row.tasks!,
        isCompleted: row.task_history.completed === 1,
        isPlanned: row.task_history.planned === 1,
      }));

    // Transform history habits to unified format
    const snapshotHabits: DaySnapshotHabit[] = historyHabits
      .filter((row) => row.habits !== null) // Filter out deleted habits
      .map((row) => ({
        habit: row.habits!,
        isCompleted: row.habit_history.completed === 1,
      }));

    // Calculate perfect day from history
    const isPerfectDay =
      historyHabits.length > 0 &&
      historyHabits.every((h) => h.habit_history.completed === 1);

    return {
      date,
      tasks: snapshotTasks,
      habits: snapshotHabits,
      isPerfectDay,
    };
  }
}

// ====== Types ======
export type Task = import("@/lib/db/schema").Task;
export type Habit = import("@/lib/db/schema").Habit;
export type HabitCompletion = import("@/lib/db/schema").HabitCompletion;
