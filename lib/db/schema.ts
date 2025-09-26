import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { sql } from "drizzle-orm";

// Meta table for app configuration and state (kept)
export const meta = sqliteTable("meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// Single immutable event log table
export const events = sqliteTable("events", {
  id: integer("id").primaryKey(),
  timestamp: integer("timestamp", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
  type: text("type").notNull(),
  payload: text("payload", { mode: "json" }).notNull(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
