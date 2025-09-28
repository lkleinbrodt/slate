import {
  appSettings,
  habitCompletions,
  habitHistory,
  habits,
  taskHistory,
  tasks,
} from "@/lib/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

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
    .where(and(sql`status IN ('open', 'done')`, eq(tasks.scheduledFor, date)));
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

// ====== Types ======
export type Task = import("@/lib/db/schema").Task;
export type Habit = import("@/lib/db/schema").Habit;
export type HabitCompletion = import("@/lib/db/schema").HabitCompletion;
