import assert from "assert";
import Database from "better-sqlite3";

import * as repo from "@/lib/logic/repo";
import { calculateBaseStreaks } from "@/lib/logic/streaks";
import { MIGRATIONS } from "@/lib/db/migrations";
import { voiceSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { applyMigrations, db, resetDatabase } from "./mocks/db-connection";
import {
  completeHabitOn,
  insertHabit,
  insertHabitHistory,
  insertTask,
} from "./helpers";

export async function run() {
  await testTodayListUsesLogicalCompletionDay();
  await testTodayListIncludesStalePastDoDates();
  await testPastDaySnapshotReadsBooleans();
  await testBaseStreaks();
  await testMigrationBackfillsCompletedDate();
  await testVoiceSessionRoundTripsJSON();
  await testUnfinishedVoiceSessionIsNewestOpen();
}

async function testTodayListUsesLogicalCompletionDay() {
  resetDatabase();
  const today = "2024-07-10";

  const doneToday = await insertTask({
    scheduledFor: today,
    status: "done",
    // Late evening in the US is already tomorrow in UTC
    completedAt: "2024-07-11T03:00:00.000Z",
    completedDate: today,
  });
  const doneYesterday = await insertTask({
    scheduledFor: "2024-07-09",
    status: "done",
    completedAt: "2024-07-09T18:00:00.000Z",
    completedDate: "2024-07-09",
  });
  const openToday = await insertTask({ scheduledFor: today });
  const deleted = await insertTask({ scheduledFor: today, status: "archived" });

  const ids = (await repo.listTodayTasks(today)).map((t) => t.id).sort();
  assert.deepStrictEqual(ids, [doneToday.id, openToday.id].sort());
  assert(!ids.includes(doneYesterday.id));
  assert(!ids.includes(deleted.id));
}

async function testTodayListIncludesStalePastDoDates() {
  resetDatabase();
  const today = "2024-07-10";
  const stale = await insertTask({ scheduledFor: "2024-07-01" });
  const future = await insertTask({ scheduledFor: "2024-07-11" });

  const ids = (await repo.listTodayTasks(today)).map((t) => t.id);
  assert(ids.includes(stale.id), "open tasks with past do-dates show in Today");
  assert(!ids.includes(future.id));
}

async function testPastDaySnapshotReadsBooleans() {
  resetDatabase();
  const habit = await insertHabit();
  await insertHabitHistory(habit.id, "2024-07-01", true);

  const snapshot = await repo.getDaySnapshot("2024-07-01", "2024-07-10");
  assert.strictEqual(snapshot.habits.length, 1);
  assert.strictEqual(snapshot.habits[0].isCompleted, true);
  assert.strictEqual(snapshot.isPerfectDay, true);
}

async function testBaseStreaks() {
  resetDatabase();
  const today = "2024-07-10";
  const steady = await insertHabit();
  const broken = await insertHabit();
  const fresh = await insertHabit();

  for (const d of ["2024-07-07", "2024-07-08", "2024-07-09"]) {
    await insertHabitHistory(steady.id, d, true);
  }
  await insertHabitHistory(broken.id, "2024-07-08", true);
  await insertHabitHistory(broken.id, "2024-07-09", false);
  // Completions for today live in habit_completions, not history
  await completeHabitOn(fresh.id, today);

  const streaks = await calculateBaseStreaks(
    [steady.id, broken.id, fresh.id],
    today
  );
  assert.deepStrictEqual(streaks, {
    [steady.id]: 3,
    [broken.id]: 0,
    [fresh.id]: 0,
  });
}

async function testMigrationBackfillsCompletedDate() {
  // Simulate an install created before migration tracking (user_version 0)
  const legacy = new Database(":memory:");
  legacy.exec(MIGRATIONS[0].sql);
  legacy.exec(`
    INSERT INTO tasks (id, title, scheduled_for, completed_at, created_at, updated_at, status)
    VALUES
      ('planned', 'a', '2024-07-01', '2024-07-02T03:00:00.000Z', 'x', 'x', 'done'),
      ('open', 'b', '2024-07-01', NULL, 'x', 'x', 'open');
  `);

  applyMigrations(legacy);

  const rows = legacy
    .prepare("SELECT id, completed_date FROM tasks ORDER BY id")
    .all() as { id: string; completed_date: string | null }[];
  assert.deepStrictEqual(rows, [
    { id: "open", completed_date: null },
    { id: "planned", completed_date: "2024-07-01" },
  ]);
  assert.strictEqual(
    legacy.pragma("user_version", { simple: true }),
    MIGRATIONS[MIGRATIONS.length - 1].version
  );
}

async function testVoiceSessionRoundTripsJSON() {
  resetDatabase();
  const snapshot = { date: "2024-07-10", today: [{ ref: "t1", title: "Write the report" }] };
  const created = await repo.createVoiceSession({ mode: "plan_day", date: "2024-07-10", character: "elle", snapshot });
  assert.strictEqual(created.status, "calling");

  const transcript = [{ role: "user", text: "Hi", at: "2024-07-10T15:00:00Z" }];
  await repo.updateVoiceSession(created.id, { callId: "c1", status: "ended", transcript });
  const row = await repo.getVoiceSession(created.id);
  assert(row);
  assert.strictEqual(row.callId, "c1");
  assert.strictEqual(row.status, "ended");
  assert.deepStrictEqual(row.snapshot, snapshot);
  assert.deepStrictEqual(row.transcript, transcript);
  assert.strictEqual(row.proposal, null);
  assert.strictEqual(row.startedAt, created.startedAt);
}

async function testUnfinishedVoiceSessionIsNewestOpen() {
  resetDatabase();
  assert.strictEqual(await repo.getUnfinishedVoiceSession(), undefined);

  const make = async (startedAt: string, status: repo.VoiceSession["status"]) => {
    const s = await repo.createVoiceSession({ mode: "plan_day", date: startedAt.slice(0, 10), character: null, snapshot: {} });
    await db.update(voiceSessions).set({ startedAt, status }).where(eq(voiceSessions.id, s.id));
    return s.id;
  };
  await make("2024-07-08T15:00:00.000Z", "proposed");
  const newestOpen = await make("2024-07-09T15:00:00.000Z", "failed");
  await make("2024-07-10T15:00:00.000Z", "applied");
  await make("2024-07-10T16:00:00.000Z", "discarded");

  assert.strictEqual((await repo.getUnfinishedVoiceSession())?.id, newestOpen);
}
