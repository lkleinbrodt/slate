import { db } from "@/lib/db/connection";
import { habitCompletions, habitHistory, habits, tasks } from "@/lib/db/schema";
import { randomUUID } from "expo-crypto";

export async function insertTask(
  overrides: Partial<typeof tasks.$inferInsert> = {}
) {
  const row = {
    id: randomUUID(),
    title: "Task",
    notes: null,
    dueDate: null,
    scheduledFor: null,
    completedAt: null,
    completedDate: null,
    dependsOnTaskId: null,
    createdAt: "2024-01-01T08:00:00.000Z",
    updatedAt: "2024-01-01T08:00:00.000Z",
    status: "open" as const,
    ...overrides,
  };
  await db.insert(tasks).values(row);
  return row;
}

export async function insertHabit(
  overrides: Partial<typeof habits.$inferInsert> = {}
) {
  const row = {
    id: randomUUID(),
    title: "Habit",
    notes: null,
    isActive: true,
    createdAt: "2024-01-01T08:00:00.000Z",
    updatedAt: "2024-01-01T08:00:00.000Z",
    ...overrides,
  };
  await db.insert(habits).values(row);
  return row;
}

export async function completeHabitOn(habitId: string, date: string) {
  await db.insert(habitCompletions).values({
    id: randomUUID(),
    habitId,
    date,
    completedAt: `${date}T12:00:00.000Z`,
  });
}

export async function insertHabitHistory(
  habitId: string,
  date: string,
  completed: boolean
) {
  await db
    .insert(habitHistory)
    .values({ id: randomUUID(), habitId, date, completed });
}
