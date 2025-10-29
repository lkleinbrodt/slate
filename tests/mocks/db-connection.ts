import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";

const sqlite = new Database(":memory:");

const createSchema = () => {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      notes TEXT,
      due_date TEXT,
      scheduled_for TEXT,
      completed_at TEXT,
      depends_on_task_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open'
    );

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      notes TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS habit_completions (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS habit_history (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      habit_id TEXT NOT NULL,
      completed INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_history (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      task_id TEXT NOT NULL,
      planned INTEGER NOT NULL,
      completed INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
};

createSchema();

export const db = drizzle(sqlite, { schema });

export const initializeDatabase = async () => {
  createSchema();
};

export const resetDatabase = () => {
  sqlite.exec(`
    DELETE FROM habit_history;
    DELETE FROM habit_completions;
    DELETE FROM task_history;
    DELETE FROM tasks;
    DELETE FROM habits;
    DELETE FROM app_settings;
  `);
};
