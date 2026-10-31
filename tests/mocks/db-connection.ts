import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import { MIGRATIONS } from "@/lib/db/migrations";

const sqlite = new Database(":memory:");

// Same migrations the app runs, so tests exercise the real schema
export const applyMigrations = (database: Database.Database) => {
  const currentVersion = database.pragma("user_version", { simple: true }) as number;
  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) continue;
    database.transaction(() => {
      database.exec(migration.sql);
      database.pragma(`user_version = ${migration.version}`);
    })();
  }
};

applyMigrations(sqlite);

export const db = drizzle(sqlite, { schema });

export const initializeDatabase = async () => {
  applyMigrations(sqlite);
};

export const resetDatabase = () => {
  sqlite.exec(`
    DELETE FROM habit_history;
    DELETE FROM habit_completions;
    DELETE FROM task_history;
    DELETE FROM tasks;
    DELETE FROM habits;
    DELETE FROM app_settings;
    DELETE FROM voice_sessions;
  `);
};
