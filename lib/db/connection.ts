import * as schema from "./schema";

import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import { MIGRATIONS } from "./migrations";

// Open SQLite database
const expoDb = openDatabaseSync("slate_v2.db");
export const db = drizzle(expoDb, { schema });

// Database initialization: apply any migrations newer than the stored user_version
export async function initializeDatabase() {
  try {
    await expoDb.execAsync("PRAGMA journal_mode = WAL;");
    const row = await expoDb.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version"
    );
    const currentVersion = row?.user_version ?? 0;

    for (const migration of MIGRATIONS) {
      if (migration.version <= currentVersion) continue;
      console.log(`Applying database migration v${migration.version}...`);
      await expoDb.withTransactionAsync(async () => {
        await expoDb.execAsync(migration.sql);
        await expoDb.execAsync(`PRAGMA user_version = ${migration.version};`);
      });
    }
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}
