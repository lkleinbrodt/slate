import * as schema from "./schema";

import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

// Open SQLite database
const expo = openDatabaseSync("slate.db");
export const db = drizzle(expo, { schema });

// Database initialization function
export async function initializeDatabase() {
  try {
    // Create tables if they don't exist
    await expo.execAsync(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Single immutable event log table
    await expo.execAsync(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY,
        timestamp INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
        type TEXT NOT NULL,
        payload TEXT NOT NULL
      );
    `);

    // No additional indexes needed initially

    // Initialize schema version if not exists
    const result = await expo.getFirstAsync(`
      SELECT value FROM meta WHERE key = 'schema_version'
    `);

    if (!result) {
      await expo.execAsync(`
        INSERT INTO meta (key, value) VALUES ('schema_version', '3')
      `);
    } else {
      // Update schema version for existing databases
      await expo.execAsync(`
        UPDATE meta SET value = '3' WHERE key = 'schema_version'
      `);
    }

    // Initialize day_start if not exists
    const dayStartResult = await expo.getFirstAsync(`
      SELECT value FROM meta WHERE key = 'day_start'
    `);

    if (!dayStartResult) {
      await expo.execAsync(`
        INSERT INTO meta (key, value) VALUES ('day_start', '04:00')
      `);
    }

    // Initialize auto_carryover if not exists
    const carryoverResult = await expo.getFirstAsync(`
      SELECT value FROM meta WHERE key = 'auto_carryover'
    `);

    if (!carryoverResult) {
      await expo.execAsync(`
        INSERT INTO meta (key, value) VALUES ('auto_carryover', 'true')
      `);
    }

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}
