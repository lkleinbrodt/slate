import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  notes: text("notes"),
  dueDate: text("due_date"),
  scheduledFor: text("scheduled_for"),
  completedAt: text("completed_at"),
  // Logical day (respecting day start) the task was completed on, YYYY-MM-DD
  completedDate: text("completed_date"),
  dependsOnTaskId: text("depends_on_task_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  status: text("status", { enum: ["open", "done", "archived"] })
    .notNull()
    .default("open"),
});

export const habits = sqliteTable("habits", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  notes: text("notes"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const habitCompletions = sqliteTable("habit_completions", {
  id: text("id").primaryKey(),
  habitId: text("habit_id").notNull(),
  date: text("date").notNull(),
  completedAt: text("completed_at").notNull(),
});

export const habitHistory = sqliteTable("habit_history", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  habitId: text("habit_id").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull(),
});

export const taskHistory = sqliteTable("task_history", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  taskId: text("task_id").notNull(),
  planned: integer("planned", { mode: "boolean" }).notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull(),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const VOICE_SESSION_STATUSES = [
  "calling",
  "ended",
  "planning",
  "proposed",
  "applied",
  "discarded",
  "failed",
] as const;
export type VoiceSessionStatus = (typeof VOICE_SESSION_STATUSES)[number];

// JSON columns are text in SQLite; drizzle parses and serializes them
export const voiceSessions = sqliteTable("voice_sessions", {
  id: text("id").primaryKey(),
  mode: text("mode", { enum: ["plan_day"] }).notNull(),
  // Logical day (respecting day start) the call was for, YYYY-MM-DD
  date: text("date").notNull(),
  startedAt: text("started_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  character: text("character"),
  callId: text("call_id"),
  status: text("status", { enum: VOICE_SESSION_STATUSES }).notNull(),
  error: text("error"),
  snapshot: text("snapshot", { mode: "json" }).$type<unknown>(),
  transcript: text("transcript", { mode: "json" }).$type<unknown>(),
  proposal: text("proposal", { mode: "json" }).$type<unknown>(),
  applied: text("applied", { mode: "json" }).$type<unknown>(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type NewHabitCompletion = typeof habitCompletions.$inferInsert;
export type HabitHistory = typeof habitHistory.$inferSelect;
export type TaskHistory = typeof taskHistory.$inferSelect;
export type VoiceSession = typeof voiceSessions.$inferSelect;
