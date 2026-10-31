import assert from "assert";
import { eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";

import { db } from "@/lib/db/connection";
import { taskHistory, tasks } from "@/lib/db/schema";
import { applyChanges } from "@/lib/voice/planDay/apply";
import { DEFAULT_PLAN_MODEL, buildExtractionPrompt, extractPlan, validateProposal } from "@/lib/voice/planDay/extract";
import { buildInstructions, spokenDay } from "@/lib/voice/planDay/instructions";
import { describeChange } from "@/lib/voice/planDay/describe";
import { buildDaySnapshot, type DaySnapshot } from "@/lib/voice/planDay/snapshot";
import { useAppStore } from "@/lib/stores/appStore";
import { useTimeStore } from "@/lib/stores/timeStore";
import { resetDatabase } from "./mocks/db-connection";
import { completeHabitOn, insertHabit, insertHabitHistory, insertTask } from "./helpers";

const TODAY = "2024-08-10"; // a Saturday

export async function run() {
  await testSnapshot();
  await testInstructions();
  testSpokenDay();
  await testExtractionPrompt();
  await testValidateKeepsWhatFits();
  await testValidateDropsWhatDoesnt();
  await testExtractPlanCallsOpenRouter();
  await testApply();
  testDescribeChange();
}

function setUp() {
  resetDatabase();
  useTimeStore.setState({ currentDate: TODAY, isInitialized: true });
  useAppStore.setState({ isInitialized: true });
}

/** A small day: two on Today (one carried over, one done), four on the Slate, one habit. */
async function seedDay() {
  setUp();
  const report = await insertTask({ title: "Write the report", scheduledFor: TODAY });
  await db.insert(taskHistory).values({ id: randomUUID(), date: "2024-08-09", taskId: report.id, planned: true, completed: false });
  const run = await insertTask({ title: "Go for a run", scheduledFor: TODAY, status: "done", completedDate: TODAY, completedAt: "2024-08-10T15:00:00.000Z" });
  const taxes = await insertTask({ title: "Taxes", dueDate: "2024-08-08", createdAt: "2024-01-02T00:00:00.000Z" });
  const bank = await insertTask({ title: "Call the bank", dueDate: "2024-08-12", notes: "ask about  the\nfee" });
  const paint = await insertTask({ title: "Paint the fence", createdAt: "2024-03-01T00:00:00.000Z" });
  const dentist = await insertTask({ title: "Book dentist", scheduledFor: "2024-08-15" });
  await insertTask({ title: "Old thing", status: "archived" });
  const stretch = await insertHabit({ title: "Stretch" });
  await insertHabitHistory(stretch.id, "2024-08-08", true);
  await insertHabitHistory(stretch.id, "2024-08-09", true);
  await completeHabitOn(stretch.id, TODAY);
  return { report, run, taxes, bank, paint, dentist };
}

async function testSnapshot() {
  const t = await seedDay();
  const s = await buildDaySnapshot(TODAY);
  assert.deepStrictEqual(s.today.map((x) => [x.ref, x.title, x.done, x.carriedOver]), [
    ["t1", "Write the report", false, true],
    ["t2", "Go for a run", true, false],
  ]);
  // Overdue first, then due soon, then planned for later, then the rest; archived left out
  assert.deepStrictEqual(s.slate.map((x) => [x.ref, x.title]), [
    ["t3", "Taxes"],
    ["t4", "Call the bank"],
    ["t5", "Book dentist"],
    ["t6", "Paint the fence"],
  ]);
  assert.strictEqual(s.slate[0].id, t.taxes.id);
  assert.strictEqual(s.slateOmitted, 0);
  assert.deepStrictEqual(s.habits, [{ title: "Stretch", doneToday: true, streak: 3 }]);
  // Plain JSON, so a voice session can store it
  assert.deepStrictEqual(JSON.parse(JSON.stringify(s)), s);
}

async function testInstructions() {
  await seedDay();
  const text = buildInstructions(await buildDaySnapshot(TODAY));
  assert.match(text, /plan his day, Saturday, August 10\./);
  assert.match(text, /Already on today:\n- Write the report, carried over from yesterday/);
  assert.match(text, /Done today:\n- Go for a run/);
  assert.match(text, /Due within a week, not on today:\n- Taxes, overdue, was due last Thursday\n- Call the bank, due Monday \(note: ask about the fee\)/);
  assert.match(text, /The rest of his Slate[^\n]*:\n- Book dentist, planned for Thursday\n- Paint the fence/);
  assert.match(text, /- Stretch: done today, a 3-day streak/);
  // No refs or ids: those are for the extraction
  assert.doesNotMatch(text, /\bt\d\b/);

  setUp();
  assert.match(buildInstructions(await buildDaySnapshot(TODAY)), /Nothing is on today yet\./);
}

function testSpokenDay() {
  assert.strictEqual(spokenDay("2024-08-10", TODAY), "today");
  assert.strictEqual(spokenDay("2024-08-11", TODAY), "tomorrow");
  assert.strictEqual(spokenDay("2024-08-09", TODAY), "yesterday");
  assert.strictEqual(spokenDay("2024-08-14", TODAY), "Wednesday");
  assert.strictEqual(spokenDay("2024-08-06", TODAY), "last Tuesday");
  assert.strictEqual(spokenDay("2024-08-20", TODAY), "Tuesday, August 20");
}

async function testExtractionPrompt() {
  await seedDay();
  const snapshot = await buildDaySnapshot(TODAY);
  const { system, user } = buildExtractionPrompt(snapshot, [
    { role: "assistant", text: "Morning! The taxes are overdue.", at: "", interrupted: true },
    { role: "user", text: "Yeah, taxes today.", at: "" },
  ]);
  assert.match(system, /today is 2024-08-10 \(Saturday\)/);
  assert.match(user, /t1: Write the report \(carried over from yesterday\)/);
  assert.match(user, /t2: Go for a run \(done today\)/);
  assert.match(user, /t3: Taxes \(due 2024-08-08\)/);
  assert.match(user, /t5: Book dentist \(planned for 2024-08-15\)/);
  assert.match(user, /Assistant: Morning! The taxes are overdue\. \[cut off\]\nLandon: Yeah, taxes today\./);
}

const change = (fields: Record<string, unknown>) => ({
  task: null, title: null, notes: null, due: null, until: null, today: null, reason: "he said so", ...fields,
});

async function testValidateKeepsWhatFits() {
  const t = await seedDay();
  const snapshot = await buildDaySnapshot(TODAY);
  const p = validateProposal(
    {
      summary: "  Taxes and the report today.  ",
      changes: [
        change({ kind: "plan_today", task: "t3" }),
        change({ kind: "send_to_slate", task: "t1" }),
        change({ kind: "snooze", task: "t6", until: "2024-08-17" }),
        change({ kind: "set_due", task: "t4", due: null }),
        change({ kind: "complete", task: "t5" }),
        change({ kind: "create", title: " Buy milk ", notes: " ", due: "2024-08-11", today: true }),
      ],
    },
    snapshot
  );
  assert.strictEqual(p.summary, "Taxes and the report today.");
  assert.deepStrictEqual(p.dropped, []);
  assert.deepStrictEqual(p.changes, [
    { kind: "plan_today", taskId: t.taxes.id, title: "Taxes", reason: "he said so" },
    { kind: "send_to_slate", taskId: t.report.id, title: "Write the report", reason: "he said so" },
    { kind: "snooze", taskId: t.paint.id, title: "Paint the fence", until: "2024-08-17", reason: "he said so" },
    { kind: "set_due", taskId: t.bank.id, title: "Call the bank", due: null, reason: "he said so" },
    { kind: "complete", taskId: t.dentist.id, title: "Book dentist", reason: "he said so" },
    { kind: "create", title: "Buy milk", notes: null, due: "2024-08-11", today: true, reason: "he said so" },
  ]);
}

async function testValidateDropsWhatDoesnt() {
  await seedDay();
  const snapshot = await buildDaySnapshot(TODAY);
  const p = validateProposal(
    {
      summary: "x",
      changes: [
        change({ kind: "explode", task: "t1" }),
        change({ kind: "plan_today", task: "t99" }),
        change({ kind: "plan_today", task: "t1" }), // already on today
        change({ kind: "plan_today", task: "t2" }), // done
        change({ kind: "send_to_slate", task: "t3" }), // not on today
        change({ kind: "snooze", task: "t3", until: "2024-08-10" }), // not later
        change({ kind: "snooze", task: "t5", until: "2024-08-15" }), // already then
        change({ kind: "set_due", task: "t3", due: "2024-08-01" }), // past
        change({ kind: "set_due", task: "t4", due: "2024-08-12" }), // unchanged
        change({ kind: "set_due", task: "t6", due: "2024-02-30" }), // not a day
        change({ kind: "complete", task: "t2" }), // done
        change({ kind: "create", title: "  " }),
        change({ kind: "create", title: "call the BANK" }), // exists: use its ref
        // He changed his mind: the last word on t6 wins
        change({ kind: "plan_today", task: "t6" }),
        change({ kind: "snooze", task: "t6", until: "2024-08-12" }),
        // Marking done replaces moving it
        change({ kind: "plan_today", task: "t4" }),
        change({ kind: "complete", task: "t4" }),
        // A bad due date on a new task drops the date, not the task
        change({ kind: "create", title: "Fix bike", due: "yesterday", today: false }),
        // Deleting replaces moving it, and the last of done or deleted wins
        change({ kind: "plan_today", task: "t3" }),
        change({ kind: "complete", task: "t3" }),
        change({ kind: "delete", task: "t3" }),
        change({ kind: "delete", task: "t2" }), // done
      ],
    },
    snapshot
  );
  assert.deepStrictEqual(
    p.changes.map((c) => [c.kind, "until" in c ? c.until : "due" in c ? c.due : null, c.title]),
    [
      ["snooze", "2024-08-12", "Paint the fence"],
      ["complete", null, "Call the bank"],
      ["create", null, "Fix bike"],
      ["delete", null, "Taxes"],
    ]
  );
  assert.deepStrictEqual(
    p.dropped.map((d) => d.why),
    [
      "unknown kind",
      "unknown task t99",
      "already on today",
      "already done",
      "not on today",
      "snooze needs a later day, got 2024-08-10",
      "already planned for that day",
      "due date 2024-08-01 isn't a day from today on",
      "due date unchanged",
      "due date 2024-02-30 isn't a day from today on",
      "already done",
      "no title",
      "already a task (t4)",
      "due date yesterday isn't a day from today on; kept the task without it",
      "already done",
      "the task is being marked done",
      "the task is being deleted",
    ]
  );
  assert.throws(() => validateProposal({ changes: [] }, snapshot), /wrong shape/);
}

async function testExtractPlanCallsOpenRouter() {
  await seedDay();
  const snapshot: DaySnapshot = await buildDaySnapshot(TODAY);
  let sent: { url: string; headers: Record<string, string>; body: any } | null = null;
  const reply = { summary: "Taxes today.", changes: [change({ kind: "plan_today", task: "t3" })] };
  const fakeFetch = (async (url: string, init: RequestInit) => {
    sent = { url, headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) };
    return new Response(
      JSON.stringify({ model: DEFAULT_PLAN_MODEL, choices: [{ message: { content: JSON.stringify(reply) } }], usage: { cost: 0.021 } }),
      { status: 200 }
    );
  }) as unknown as typeof fetch;

  const p = await extractPlan({ snapshot, transcript: [{ role: "user", text: "Taxes today.", at: "" }], apiKey: "sk-test", fetchImpl: fakeFetch });
  assert.strictEqual(p.changes.length, 1);
  assert.strictEqual(p.costUsd, 0.021);
  assert.ok(sent);
  const req = sent as { url: string; headers: Record<string, string>; body: any };
  assert.strictEqual(req.url, "https://openrouter.ai/api/v1/chat/completions");
  assert.strictEqual(req.headers.Authorization, "Bearer sk-test");
  assert.strictEqual(req.body.model, DEFAULT_PLAN_MODEL);
  assert.strictEqual(req.body.response_format.json_schema.strict, true);
  assert.strictEqual(req.body.provider.require_parameters, true);
  // With require_parameters, any unsupported parameter rules out every provider
  assert.deepStrictEqual(Object.keys(req.body).sort(), ["messages", "model", "provider", "response_format", "usage"]);
  assert.match(req.body.messages[1].content, /Landon: Taxes today\./);

  const refused = (async () =>
    new Response(JSON.stringify({ error: { message: "No auth credentials found" } }), { status: 401 })) as unknown as typeof fetch;
  await assert.rejects(extractPlan({ snapshot, transcript: [], apiKey: "bad", fetchImpl: refused }), /No auth credentials found/);
}

async function testApply() {
  const t = await seedDay();
  await useAppStore.getState().refreshData();
  const get = (id: string) => db.select().from(tasks).where(eq(tasks.id, id)).get();
  const ignored = await insertTask({ title: "Deleted meanwhile" });
  await db.update(tasks).set({ status: "archived" }).where(eq(tasks.id, ignored.id));
  const dropIt = await insertTask({ title: "Learn the banjo" });

  const result = await applyChanges([
    { kind: "set_due", taskId: t.paint.id, title: "Paint the fence", due: TODAY, reason: "" },
    { kind: "send_to_slate", taskId: t.report.id, title: "Write the report", reason: "" },
    { kind: "plan_today", taskId: t.taxes.id, title: "Taxes", reason: "" },
    { kind: "snooze", taskId: t.dentist.id, title: "Book dentist", until: "2024-08-12", reason: "" },
    { kind: "complete", taskId: t.bank.id, title: "Call the bank", reason: "" },
    { kind: "create", title: "Buy milk", notes: "oat", due: "2024-08-14", today: true, reason: "" },
    { kind: "create", title: "Fix bike", notes: null, due: null, today: false, reason: "" },
    { kind: "plan_today", taskId: ignored.id, title: "Deleted meanwhile", reason: "" },
    { kind: "delete", taskId: dropIt.id, title: "Learn the banjo", reason: "" },
  ]);

  assert.strictEqual(result.applied.length, 8);
  assert.strictEqual((await get(dropIt.id))?.status, "archived");
  assert.deepStrictEqual(result.skipped.map((s) => s.why), ["it's deleted now"]);
  assert.strictEqual((await get(t.report.id))?.scheduledFor, null);
  assert.strictEqual((await get(t.taxes.id))?.scheduledFor, TODAY);
  assert.strictEqual((await get(t.dentist.id))?.scheduledFor, "2024-08-12");
  assert.strictEqual((await get(t.bank.id))?.status, "done");
  assert.strictEqual((await get(t.bank.id))?.completedDate, TODAY);
  // Due today pulls it onto Today, as an edit by hand does
  assert.deepStrictEqual([(await get(t.paint.id))?.dueDate, (await get(t.paint.id))?.scheduledFor], [TODAY, TODAY]);
  const created = await db.select().from(tasks).where(eq(tasks.title, "Buy milk")).get();
  assert.deepStrictEqual([created?.scheduledFor, created?.dueDate, created?.notes], [TODAY, "2024-08-14", "oat"]);
  const bike = await db.select().from(tasks).where(eq(tasks.title, "Fix bike")).get();
  assert.strictEqual(bike?.scheduledFor, null);
  // The store saw it all
  const titles = useAppStore.getState().todayTasks.map((x) => x.title).sort();
  assert.deepStrictEqual(titles, ["Buy milk", "Call the bank", "Go for a run", "Paint the fence", "Taxes"]);
}

function testDescribeChange() {
  const base = { taskId: "x", title: "Taxes", reason: "" };
  const line = (c: Parameters<typeof describeChange>[0]) => {
    const d = describeChange(c, TODAY);
    return [d.action, d.title, d.detail];
  };
  assert.deepStrictEqual(line({ kind: "plan_today", ...base }), ["Today", "Taxes", null]);
  assert.deepStrictEqual(line({ kind: "send_to_slate", ...base }), ["Off today", "Taxes", "back to the Slate"]);
  assert.deepStrictEqual(line({ kind: "snooze", ...base, until: "2024-08-11" }), ["Move to tomorrow", "Taxes", null]);
  assert.deepStrictEqual(line({ kind: "set_due", ...base, due: "2024-08-16" }), ["Due Friday", "Taxes", null]);
  assert.deepStrictEqual(line({ kind: "set_due", ...base, due: null }), ["No due date", "Taxes", null]);
  assert.deepStrictEqual(line({ kind: "complete", ...base }), ["Done", "Taxes", null]);
  assert.deepStrictEqual(line({ kind: "delete", ...base }), ["Delete", "Taxes", null]);
  assert.deepStrictEqual(
    line({ kind: "create", title: "Buy milk", notes: null, due: "2024-08-12", today: true, reason: "" }),
    ["New task", "Buy milk", "on today, due Monday"]
  );
  assert.deepStrictEqual(line({ kind: "create", title: "Fix bike", notes: null, due: null, today: false, reason: "" }), ["New task", "Fix bike", null]);
}
