import * as schema from "./schema";

import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

// Open SQLite database
const expoDb = openDatabaseSync("slate_v2.db");
export const db = drizzle(expoDb, { schema });

// Database initialization function
export async function initializeDatabase() {
  try {
    console.log("Initializing database with new schema...");
    await expoDb.execAsync(`
      PRAGMA journal_mode = WAL;
  
      -- tasks: one-off items
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        notes TEXT,
        due_date TEXT,               -- ISO date (YYYY-MM-DD), optional
        scheduled_for TEXT,          -- ISO date; when planned for a day
        completed_at TEXT,           -- ISO datetime; null if not completed
        depends_on_task_id TEXT,     -- nullable FK into tasks.id
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open' -- 'open' | 'done' | 'archived'
      );
  
      -- habits: daily items
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        notes TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
  
      -- habit_completions: one row per habit per day completed (live state for the current day)
      CREATE TABLE IF NOT EXISTS habit_completions (
        id TEXT PRIMARY KEY,
        habit_id TEXT NOT NULL,
        date TEXT NOT NULL,          -- ISO date of completion (local)
        completed_at TEXT NOT NULL,  -- ISO datetime
        UNIQUE(habit_id, date)
      );
  
      -- habit_history: authoritative per-day record for all habits (completed or not)
      CREATE TABLE IF NOT EXISTS habit_history (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,          -- YYYY-MM-DD (local)
        habit_id TEXT NOT NULL,
        completed INTEGER NOT NULL,  -- 0/1 whether it was completed on that date
        UNIQUE(date, habit_id)
      );
  
      -- task_history: authoritative per-day record of tasks relevant to that day
      CREATE TABLE IF NOT EXISTS task_history (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,          -- YYYY-MM-DD (local)
        task_id TEXT NOT NULL,
        planned INTEGER NOT NULL,    -- 0/1 whether it was scheduled_for this date at end-of-day
        completed INTEGER NOT NULL,  -- 0/1 whether completed on this date
        UNIQUE(date, task_id)
      );
  
      -- app_settings: single-row-ish KV in SQL
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
  
      -- Create Indexes
      CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
      CREATE INDEX IF NOT EXISTS idx_tasks_sched ON tasks(scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed_at);
      CREATE INDEX IF NOT EXISTS idx_hc_habit_date ON habit_completions(habit_id, date);
      CREATE INDEX IF NOT EXISTS idx_hh_date ON habit_history(date);
      CREATE INDEX IF NOT EXISTS idx_hh_habit ON habit_history(habit_id);
      CREATE INDEX IF NOT EXISTS idx_th_date ON task_history(date);
      CREATE INDEX IF NOT EXISTS idx_th_task ON task_history(task_id);
    `);
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}
