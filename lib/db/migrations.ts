/**
 * Ordered schema migrations, tracked via SQLite's `PRAGMA user_version`.
 *
 * Rules:
 * - Never edit a migration that has shipped; append a new one instead.
 * - Each migration runs inside a transaction together with the version bump.
 *
 * Kept free of expo imports so tests can run the same SQL against better-sqlite3.
 */
export interface Migration {
  version: number;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    // Baseline schema. Uses IF NOT EXISTS because installs that predate
    // migration tracking already have these tables (at user_version 0).
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        notes TEXT,
        due_date TEXT,               -- YYYY-MM-DD, optional
        scheduled_for TEXT,          -- YYYY-MM-DD "do date", optional
        completed_at TEXT,           -- ISO datetime; null if not completed
        depends_on_task_id TEXT,     -- nullable FK into tasks.id
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open' -- 'open' | 'done' | 'archived'
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
        completed_at TEXT NOT NULL,
        UNIQUE(habit_id, date)
      );

      CREATE TABLE IF NOT EXISTS habit_history (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        habit_id TEXT NOT NULL,
        completed INTEGER NOT NULL,
        UNIQUE(date, habit_id)
      );

      CREATE TABLE IF NOT EXISTS task_history (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        task_id TEXT NOT NULL,
        planned INTEGER NOT NULL,
        completed INTEGER NOT NULL,
        UNIQUE(date, task_id)
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
      CREATE INDEX IF NOT EXISTS idx_tasks_sched ON tasks(scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed_at);
      CREATE INDEX IF NOT EXISTS idx_hc_habit_date ON habit_completions(habit_id, date);
      CREATE INDEX IF NOT EXISTS idx_hh_date ON habit_history(date);
      CREATE INDEX IF NOT EXISTS idx_hh_habit ON habit_history(habit_id);
      CREATE INDEX IF NOT EXISTS idx_th_date ON task_history(date);
      CREATE INDEX IF NOT EXISTS idx_th_task ON task_history(task_id);
    `,
  },
  {
    // completed_date: the app's logical day (respecting day start) on which a
    // task was completed. Replaces deriving the day from completed_at, which
    // is stored in UTC and ignores the day-start offset.
    // Backfill: done tasks were completed from the Today list, so their
    // scheduled_for is the day they were done; otherwise fall back to the
    // local date of completed_at shifted by the default 04:00 day start.
    version: 2,
    sql: `
      ALTER TABLE tasks ADD COLUMN completed_date TEXT;
      UPDATE tasks
        SET completed_date = COALESCE(scheduled_for, date(completed_at, 'localtime', '-4 hours'))
        WHERE completed_at IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_tasks_completed_date ON tasks(completed_date);
    `,
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;
