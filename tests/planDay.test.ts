import assert from "assert";
import { eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";

import { db } from "@/lib/db/connection";
import { taskHistory, tasks } from "@/lib/db/schema";
import { applyChanges } from "@/lib/voice/planDay/apply";
import { DEFAULT_PLAN_MODEL, buildExtractionPrompt, extractPlan, validateProposal } from "@/lib/voice/planDay/extract";
import { HANG_UP_PHRASE, buildInstructions, endsCall, spokenDay, spokenDuration, spokenRange, spokenTime } from "@/lib/voice/planDay/instructions";
import { describeChange } from "@/lib/voice/planDay/describe";
import { buildDaySnapshot, type DayShape, type DaySnapshot } from "@/lib/voice/planDay/snapshot";
import { DEFAULT_SCHEDULE } from "@/lib/logic/schedule";
import { useAppStore } from "@/lib/stores/appStore";
import { useTimeStore } from "@/lib/stores/timeStore";
import { resetDatabase } from "./mocks/db-connection";
import { completeHabitOn, insertHabit, insertHabitHistory, insertTask } from "./helpers";

const TODAY = "2024-08-10"; // a Saturday

export async function run() {
  await testSnapshot();
  await testInstructions();
  await testOpeningOverview();
  testSpokenDay();
  testSpokenTimes();
  await testExtractionPrompt();
  await testValidateKeepsWhatFits();
  await testValidateDropsWhatDoesnt();
  await testExtractPlanCallsOpenRouter();
  await testApply();
  testDescribeChange();
  await testScheduleSnapshot();
  await testTimesInTheCall();
  await testValidateTimes();
  await testApplyTimes();
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
  assert.deepStrictEqual(s.overdue, [{ title: "Taxes", dueDate: "2024-08-08" }]);
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
  // She can hang up for him, but only after asking
  assert(text.includes(`ends with exactly "${HANG_UP_PHRASE}"`));
  assert.match(text, /ask whether he'd like you to hang up/);
  assert(endsCall({ role: "assistant", text: "Bye for now. Hanging up now." }));
  assert(!endsCall({ role: "assistant", text: "Hanging up now.", interrupted: true }));
  assert(!endsCall({ role: "user", text: "Hanging up now." }));
  assert(!endsCall({ role: "assistant", text: "Want me to hang up?" }));
  // No refs or ids: those are for the extraction
  assert.doesNotMatch(text, /\bt\d\b/);

  setUp();
  assert.match(buildInstructions(await buildDaySnapshot(TODAY)), /Nothing is on today yet\./);
}

async function testOpeningOverview() {
  await seedDay();
  const text = buildInstructions(await buildDaySnapshot(TODAY));
  // Overdue comes first, named with how late it is
  assert.match(text, /Opening overview, in this order:\n\nOverdue \(1\):\n1\. Taxes, was due last Thursday\n\nScheduled for today:/);
  // Open tasks scheduled for today, numbered; the done one is left out
  assert.match(text, /Scheduled for today:\n1\. Write the report\n/);
  assert.doesNotMatch(text, /2\. Go for a run/);
  // Unplanned: no do date, most urgent first; the planned dentist task is not among them
  assert.match(text, /Unplanned \(no do date\): 3 in all, first 3 listed\.\n1\. Taxes\n2\. Call the bank\n3\. Paint the fence/);

  setUp();
  // More than five unplanned: five listed, the count of the rest after
  for (let i = 1; i <= 7; i++) await insertTask({ title: `Loose end ${i}`, createdAt: `2024-02-0${i}T00:00:00.000Z` });
  const many = buildInstructions(await buildDaySnapshot(TODAY));
  assert.match(many, /Unplanned \(no do date\): 7 in all, first 5 listed, 2 more after\./);
  assert.match(many, /Scheduled for today:\nNothing is scheduled for today yet\./);
  assert.match(many, /Overdue: none\./);
  assert.doesNotMatch(many, /6\. Loose end/);
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
  task: null, title: null, notes: null, due: null, until: null, today: null, start: null, duration: null, reason: "he said so", ...fields,
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
    { kind: "create", title: "Buy milk", notes: null, due: "2024-08-11", today: true, start: null, duration: null, reason: "he said so" },
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
  assert.deepStrictEqual(
    line({ kind: "create", title: "Gym", notes: null, due: null, today: true, start: "17:30", duration: 90, reason: "" }),
    ["New task", "Gym", "today at 5:30 PM, 1 hour 30 minutes"]
  );
  assert.deepStrictEqual(line({ kind: "set_time", ...base, start: "15:00", duration: 60 }), ["At 3 PM", "Taxes", "an hour"]);
  assert.deepStrictEqual(line({ kind: "set_time", ...base, start: "09:15", duration: null }), ["At 9:15 AM", "Taxes", null]);
  assert.deepStrictEqual(line({ kind: "set_time", ...base, start: null, duration: 45 }), ["Takes 45 minutes", "Taxes", null]);
  assert.deepStrictEqual(line({ kind: "clear_time", ...base }), ["No set time", "Taxes", "stays on today"]);
}

function testSpokenTimes() {
  assert.strictEqual(spokenTime("15:00"), "3 PM");
  assert.strictEqual(spokenTime("09:05"), "9:05 AM");
  assert.strictEqual(spokenTime(12 * 60), "noon");
  assert.strictEqual(spokenTime(24 * 60), "midnight");
  assert.strictEqual(spokenTime("00:30"), "12:30 AM");
  assert.strictEqual(spokenRange(15 * 60, 16 * 60), "3 to 4 PM");
  assert.strictEqual(spokenRange(11 * 60, 12 * 60 + 30), "11 AM to 12:30 PM");
  assert.strictEqual(spokenDuration(30), "30 minutes");
  assert.strictEqual(spokenDuration(60), "an hour");
  assert.strictEqual(spokenDuration(61), "1 hour 1 minute");
  assert.strictEqual(spokenDuration(120), "2 hours");
}

/** A Monday, 10:00: work 9–3, a busy dentist 4–5, a "just to see" class 6–7, an all-day thing. */
const MONDAY = "2024-08-12";
const shape = (overrides: Partial<DayShape> = {}): DayShape => ({
  now: 10 * 60,
  settings: DEFAULT_SCHEDULE,
  work: { start: 9 * 60, end: 15 * 60 },
  events: [
    { title: "Dentist", start: 16 * 60, end: 17 * 60, allDay: false, busy: true },
    { title: "Erin's class", start: 18 * 60, end: 19 * 60, allDay: false, busy: false },
    { title: "Holiday", start: 0, end: 24 * 60, allDay: true, busy: true },
  ],
  ...overrides,
});

async function seedTimedDay() {
  resetDatabase();
  useTimeStore.setState({ currentDate: MONDAY, isInitialized: true });
  useAppStore.setState({ isInitialized: true });
  const loose = await insertTask({ title: "Loose", scheduledFor: MONDAY, createdAt: "2024-01-01T00:00:00.000Z" });
  const walk = await insertTask({ title: "Walk", scheduledFor: MONDAY, startTime: "20:00", durationMin: 60 });
  const read = await insertTask({ title: "Read", scheduledFor: MONDAY, startTime: "15:30", durationMin: null });
  const sized = await insertTask({ title: "Sized", scheduledFor: MONDAY, durationMin: 45 });
  const later = await insertTask({ title: "Later", dueDate: "2024-08-20" });
  return { loose, walk, read, sized, later };
}

async function testScheduleSnapshot() {
  await seedTimedDay();
  const s = await buildDaySnapshot(MONDAY, shape());
  // Timed tasks first, in time order, then the rest
  assert.deepStrictEqual(s.today.map((t) => [t.title, t.startTime, t.durationMin]), [
    ["Read", "15:30", null],
    ["Walk", "20:00", 60],
    ["Loose", null, null],
    ["Sized", null, 45],
  ]);
  const sch = s.schedule!;
  assert.strictEqual(sch.now, 600);
  // All-day events are left out; "just to see" ones are kept, marked
  assert.deepStrictEqual(sch.events.map((e) => [e.title, e.busy]), [["Dentist", true], ["Erin's class", false]]);
  // Free: from now, after work, around Read (30 min by default), the dentist and Walk, to 10 PM.
  // The class doesn't block, and done or untimed tasks take no time.
  assert.deepStrictEqual(sch.free.map((g) => [g.start / 60, g.end / 60]), [[15, 15.5], [17, 20], [21, 22]]);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(s)), s);
  // Without a shape (no calendar), no schedule
  assert.strictEqual("schedule" in (await buildDaySnapshot(MONDAY)), false);
}


async function testTimesInTheCall() {
  await seedTimedDay();
  const snapshot = await buildDaySnapshot(MONDAY, shape());
  const text = buildInstructions(snapshot);
  assert.match(text, /offer to put times on them/);
  assert.match(text, /His day \(it's 10 AM now\):\n- Work: 9 AM to 3 PM\. He's at work then\.\n- 4 to 5 PM: Dentist\n- 6 to 7 PM: Erin's class \(someone else's, just for reference: he's free then\)\nFree for tasks: 3 to 3:30 PM, 5 to 8 PM, 9 to 10 PM\./);
  assert.doesNotMatch(text, /Holiday/);
  assert.match(text, /Scheduled for today:\n1\. Read, at 3:30 PM\n2\. Walk, at 8 PM\n3\. Loose\n4\. Sized\n/);
  assert.match(text, /Already on today:\n- Read, at 3:30 PM\n- Walk, from 8 to 9 PM\n- Loose\n- Sized, takes 45 minutes, no set time/);

  const { system, user } = buildExtractionPrompt(snapshot, [{ role: "user", text: "Taxes at 3.", at: "" }]);
  assert.match(system, /- set_time: /);
  assert.match(system, /"at 3" is 15:00/);
  assert.match(user, /When the call started it was 10:00\.\nHis calendar today:\n09:00-15:00 work\n16:00-17:00 Dentist\n18:00-19:00 Erin's class\n/);
  assert.match(user, /t1: Read \(at 15:30\)/);
  assert.match(user, /t2: Walk \(at 20:00, takes 60 min\)/);
  assert.match(user, /t4: Sized \(takes 45 min\)/);

  // An old snapshot, saved before times: no day section, no times, nothing breaks
  const old = await buildDaySnapshot(MONDAY);
  assert.doesNotMatch(buildInstructions(old), /His day/);
  assert.doesNotMatch(buildExtractionPrompt(old, []).user, /His calendar/);
}

async function testValidateTimes() {
  const t = await seedTimedDay();
  const snapshot = await buildDaySnapshot(MONDAY, shape());
  // t1 Read 15:30, t2 Walk 20:00 60m, t3 Loose, t4 Sized 45m, t5 Later (on the Slate)
  const p = validateProposal(
    {
      summary: "x",
      changes: [
        change({ kind: "set_time", task: "t3", start: "9:30", duration: 60 }),
        change({ kind: "set_time", task: "t4", duration: 30 }),
        change({ kind: "clear_time", task: "t1" }),
        // On the Slate: the time puts it on today, so plan_today is folded in
        change({ kind: "plan_today", task: "t5" }),
        change({ kind: "set_time", task: "t5", start: "17:00", duration: 90 }),
        change({ kind: "create", title: "Gym", today: true, start: "18:00", duration: 75 }),
      ],
    },
    snapshot
  );
  assert.deepStrictEqual(p.changes, [
    { kind: "set_time", taskId: t.loose.id, title: "Loose", start: "09:30", duration: 60, reason: "he said so" },
    { kind: "set_time", taskId: t.sized.id, title: "Sized", start: null, duration: 30, reason: "he said so" },
    { kind: "clear_time", taskId: t.read.id, title: "Read", reason: "he said so" },
    { kind: "set_time", taskId: t.later.id, title: "Later", start: "17:00", duration: 90, reason: "he said so" },
    { kind: "create", title: "Gym", notes: null, due: null, today: true, start: "18:00", duration: 75, reason: "he said so" },
  ]);
  assert.deepStrictEqual(p.dropped.map((d) => d.why), ["the time puts it on today"]);

  const bad = validateProposal(
    {
      summary: "x",
      changes: [
        change({ kind: "set_time", task: "t3" }),
        change({ kind: "set_time", task: "t3", start: "25:00" }),
        change({ kind: "set_time", task: "t3", start: "3pm" }),
        change({ kind: "set_time", task: "t3", duration: 0 }),
        change({ kind: "set_time", task: "t3", duration: 2000 }),
        change({ kind: "set_time", task: "t3", start: "23:45", duration: 30 }),
        change({ kind: "set_time", task: "t2", start: "20:00", duration: 60 }), // unchanged
        change({ kind: "set_time", task: "t4", duration: 45 }), // unchanged
        change({ kind: "clear_time", task: "t3" }), // no time
        change({ kind: "clear_time", task: "t5" }), // not on today
        // Done replaces a time
        change({ kind: "set_time", task: "t1", start: "16:00" }),
        change({ kind: "complete", task: "t1" }),
        // Leaving today: the length stays, the time goes
        change({ kind: "set_time", task: "t2", start: "21:00", duration: 30 }),
        change({ kind: "snooze", task: "t2", until: "2024-08-13" }),
        change({ kind: "clear_time", task: "t4" }), // no time
        // New tasks keep going without a bad time
        change({ kind: "create", title: "Nap", today: false, start: "14:00", duration: 20 }),
        change({ kind: "create", title: "Bins", today: true, start: "noon", duration: -5 }),
      ],
    },
    snapshot
  );
  assert.deepStrictEqual(
    bad.changes.map((c) => [c.kind, c.title, "start" in c ? c.start : null, "duration" in c ? c.duration : null]),
    [
      ["complete", "Read", null, null],
      ["set_time", "Walk", null, 30],
      ["snooze", "Walk", null, null],
      ["create", "Nap", null, 20],
      ["create", "Bins", null, null],
    ]
  );
  assert.deepStrictEqual(bad.dropped.map((d) => d.why), [
    "no time or length",
    "start 25:00 isn't a time",
    "start 3pm isn't a time",
    "length 0 isn't a sensible number of minutes",
    "length 2000 isn't a sensible number of minutes",
    "23:45 runs past midnight",
    "time unchanged",
    "time unchanged",
    "has no time today",
    "has no time today",
    "has no time today",
    "a start time needs it on today; kept the task without it",
    "length -5 isn't a sensible number of minutes; kept the task without it",
    "start noon isn't a time today; kept the task without it",
    "the task is being marked done",
    "it's leaving today; kept its length, not its time",
  ]);
}

async function testApplyTimes() {
  const t = await seedTimedDay();
  await useAppStore.getState().refreshData();
  const get = (id: string) => db.select().from(tasks).where(eq(tasks.id, id)).get();

  const result = await applyChanges([
    { kind: "set_time", taskId: t.later.id, title: "Later", start: "17:00", duration: 90, reason: "" },
    { kind: "set_time", taskId: t.sized.id, title: "Sized", start: null, duration: 30, reason: "" },
    { kind: "clear_time", taskId: t.read.id, title: "Read", reason: "" },
    { kind: "set_time", taskId: t.loose.id, title: "Loose", start: "21:00", duration: null, reason: "" },
    // Planned for today and given a time in one go: the time comes after the move
    { kind: "send_to_slate", taskId: t.walk.id, title: "Walk", reason: "" },
    { kind: "create", title: "Gym", notes: null, due: null, today: true, start: "18:00", duration: 75, reason: "" },
    { kind: "create", title: "Someday", notes: null, due: null, today: false, start: null, duration: 20, reason: "" },
  ]);
  assert.deepStrictEqual(result.skipped, []);
  const slot = async (id: string) => {
    const x = await get(id);
    return [x?.scheduledFor, x?.startTime, x?.durationMin];
  };
  // A time on a Slate task brings it onto today
  assert.deepStrictEqual(await slot(t.later.id), [MONDAY, "17:00", 90]);
  assert.deepStrictEqual(await slot(t.sized.id), [MONDAY, null, 30]);
  assert.deepStrictEqual(await slot(t.read.id), [MONDAY, null, null]);
  assert.deepStrictEqual(await slot(t.loose.id), [MONDAY, "21:00", null]);
  assert.deepStrictEqual(await slot(t.walk.id), [null, null, 60]);
  const gym = await db.select().from(tasks).where(eq(tasks.title, "Gym")).get();
  assert.deepStrictEqual([gym?.scheduledFor, gym?.startTime, gym?.durationMin], [MONDAY, "18:00", 75]);
  const someday = await db.select().from(tasks).where(eq(tasks.title, "Someday")).get();
  assert.deepStrictEqual([someday?.scheduledFor, someday?.startTime, someday?.durationMin], [null, null, 20]);

  // A start on a task that's done by the time he applies is skipped
  await db.update(tasks).set({ status: "done" }).where(eq(tasks.id, t.loose.id));
  const late = await applyChanges([{ kind: "set_time", taskId: t.loose.id, title: "Loose", start: "22:00", duration: null, reason: "" }]);
  assert.deepStrictEqual(late.skipped.map((s) => s.why), ["it's done now"]);
}
