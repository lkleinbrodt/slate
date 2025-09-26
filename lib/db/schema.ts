import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  notes: text("notes"),
  dueDate: text("due_date"),
  scheduledFor: text("scheduled_for"),
  completedAt: text("completed_at"),
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

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type NewHabitCompletion = typeof habitCompletions.$inferInsert;
