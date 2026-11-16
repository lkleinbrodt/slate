import assert from "assert";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/connection";
import { resetDatabase } from "./mocks/db-connection";
import { resetStorage } from "./mocks/kv-store";
import { alarms, fake } from "./mocks/calendar";
import { tasks } from "@/lib/db/schema";
import {
  DEFAULT_SCHEDULE,
  dateAt,
  freeGaps,
  minutesOnDay,
  planTasks,
  reflowPlan,
  suggestSlots,
  toMinutes,
  workBlock,
} from "@/lib/logic/schedule";
import { loadDayEvents, parseCalendarModes, reconcile, syncTask } from "@/lib/services/calendarSync";
import { processRollover, storage } from "@/lib/logic/rollover";
import { useAppStore } from "@/lib/stores/appStore";
import { useTimeStore } from "@/lib/stores/timeStore";
import { insertTask } from "./helpers";

// 2024-08-12 is a Monday, 2024-08-17 a Saturday
const MONDAY = "2024-08-12";
const SATURDAY = "2024-08-17";
const h = (hhmm: string) => toMinutes(hhmm);

export async function run() {
  testWorkBlockOnWeekdaysOnly();
  testGapsSkipWorkAndEvents();
  testGapsStartAfterNow();
  testSuggestionsComeFromDifferentGaps();
  testPlanFillsGapsInOrder();
  testReflowPushesLaterTasksDown();
  testReflowSwapsAndUndoes();
  testReflowGoesAroundEventsAndOutOfDay();
  testWallClockConversions();
  await testScheduleWritesEvent();
  await testMovingDayClearsSlotAndEvent();
  await testDoneTaskEventIsTicked();
  await testReconcilePullsMovesAndDeletes();
  await testRolloverDropsSlotAndReconcileRemovesEvent();
  await testNoAccessKeepsSlotsInSlate();
  await testDayEventsExcludeSlateCalendar();
  await testCalendarModes();
}

function setToday(date: string) {
  resetDatabase();
  resetStorage();
  fake.reset();
  useTimeStore.setState({ currentDate: date, isInitialized: true });
  useAppStore.setState({ isInitialized: true });
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
const getTask = (id: string) => db.select().from(tasks).where(eq(tasks.id, id)).get();

function testWorkBlockOnWeekdaysOnly() {
  assert.deepStrictEqual(workBlock(MONDAY, DEFAULT_SCHEDULE), { start: h("09:00"), end: h("15:00") });
  assert.strictEqual(workBlock(SATURDAY, DEFAULT_SCHEDULE), null);
  assert.strictEqual(workBlock(MONDAY, DEFAULT_SCHEDULE, true), null, "a day off has no block");
}

function testGapsSkipWorkAndEvents() {
  const work = workBlock(MONDAY, DEFAULT_SCHEDULE);
  const busy = [{ start: h("16:00"), end: h("17:00") }];
  assert.deepStrictEqual(freeGaps(busy, DEFAULT_SCHEDULE, work), [
    { start: h("08:00"), end: h("09:00") },
    { start: h("15:00"), end: h("16:00") },
    { start: h("17:00"), end: h("22:00") },
  ]);
  // Busy blocks that overlap the work block or each other merge
  const overlapping = [
    { start: h("14:30"), end: h("15:30") },
    { start: h("15:15"), end: h("15:50") },
  ];
  assert.deepStrictEqual(freeGaps(overlapping, DEFAULT_SCHEDULE, work)[1], {
    start: h("15:50"),
    end: h("22:00"),
  });
}

function testGapsStartAfterNow() {
  const gaps = freeGaps([], DEFAULT_SCHEDULE, null, h("15:42"));
  assert.deepStrictEqual(gaps, [{ start: h("15:45"), end: h("22:00") }], "rounded up to 5 minutes");
  assert.deepStrictEqual(freeGaps([], DEFAULT_SCHEDULE, null, h("23:00")), []);
}

function testSuggestionsComeFromDifferentGaps() {
  const gaps = freeGaps([{ start: h("16:00"), end: h("17:00") }], DEFAULT_SCHEDULE, workBlock(MONDAY, DEFAULT_SCHEDULE));
  assert.deepStrictEqual(suggestSlots(30, gaps), [
    { start: h("08:00"), end: h("08:30") },
    { start: h("15:00"), end: h("15:30") },
  ]);
  // 90 minutes only fits after the event
  assert.deepStrictEqual(suggestSlots(90, gaps), [{ start: h("17:00"), end: h("18:30") }]);
}

function testPlanFillsGapsInOrder() {
  const gaps = [
    { start: h("08:00"), end: h("09:00") },
    { start: h("15:00"), end: h("16:00") },
  ];
  const plan = planTasks(
    [
      { id: "a", duration: 45 },
      { id: "b", duration: 30 },
      { id: "c", duration: 15 },
      { id: "d", duration: 120 },
    ],
    gaps
  );
  assert.deepStrictEqual(plan, [
    { id: "a", start: h("08:00"), end: h("08:45") },
    { id: "b", start: h("15:00"), end: h("15:30") },
    { id: "c", start: h("08:45"), end: h("09:00") },
  ], "d fits nowhere and is left out");
}

function testReflowPushesLaterTasksDown() {
  const gaps = [{ start: h("15:00"), end: h("22:00") }];
  const plan = [
    { id: "a", start: h("15:00"), end: h("16:00") },
    { id: "b", start: h("16:00"), end: h("17:00") },
    { id: "c", start: h("17:00"), end: h("18:00") },
    { id: "d", start: h("20:00"), end: h("20:30") },
  ];
  // a dropped on 17:00: c is pushed to 18–19, b (no overlap now) stays, d is clear
  const { placed, unplaced } = reflowPlan(plan, "a", h("17:00"), gaps);
  assert.deepStrictEqual(placed, [
    { id: "b", start: h("16:00"), end: h("17:00") },
    { id: "a", start: h("17:00"), end: h("18:00") },
    { id: "c", start: h("18:00"), end: h("19:00") },
    { id: "d", start: h("20:00"), end: h("20:30") },
  ]);
  assert.deepStrictEqual(unplaced, []);

  // Dropped on 16:30, half over b and c: both slide after it, in order, and push d
  const cascade = reflowPlan(plan, "a", h("16:30"), gaps).placed;
  assert.deepStrictEqual(cascade.map((p) => [p.id, p.start]), [
    ["a", h("16:30")],
    ["b", h("17:30")],
    ["c", h("18:30")],
    ["d", h("20:00")],
  ]);
}

function testReflowSwapsAndUndoes() {
  const gaps = [{ start: h("08:00"), end: h("22:00") }];
  const plan = [
    { id: "a", start: h("16:00"), end: h("17:00") },
    { id: "b", start: h("17:00"), end: h("18:00") },
  ];
  // b dropped on a's place: a takes b's old place
  assert.deepStrictEqual(reflowPlan(plan, "b", h("16:00"), gaps).placed, [
    { id: "b", start: h("16:00"), end: h("17:00") },
    { id: "a", start: h("17:00"), end: h("18:00") },
  ]);
  // Back where it started: nothing moved
  assert.deepStrictEqual(reflowPlan(plan, "b", h("17:00"), gaps).placed, plan);
  // Anywhere, even outside the gaps (like a time picked by hand)
  assert.strictEqual(reflowPlan(plan, "b", h("06:00"), gaps).placed[0].start, h("06:00"));
}

function testReflowGoesAroundEventsAndOutOfDay() {
  // An event 18:00–19:00 and the window ending at 21:00
  const gaps = [
    { start: h("16:00"), end: h("18:00") },
    { start: h("19:00"), end: h("21:00") },
  ];
  const plan = [
    { id: "a", start: h("16:00"), end: h("16:30") },
    { id: "b", start: h("17:00"), end: h("18:00") },
    { id: "c", start: h("19:00"), end: h("21:00") },
  ];
  const { placed, unplaced } = reflowPlan(plan, "a", h("17:15"), gaps);
  assert.deepStrictEqual(placed.map((p) => [p.id, p.start]), [
    ["a", h("17:15")],
    ["b", h("19:00")],
  ], "b skips the event; c can't fit before the window ends");
  assert.deepStrictEqual(unplaced, ["c"]);
}

function testWallClockConversions() {
  const at = dateAt(MONDAY, h("15:10"));
  assert.strictEqual(at.getHours(), 15);
  assert.strictEqual(at.getMinutes(), 10);
  assert.strictEqual(minutesOnDay(at, MONDAY), h("15:10"));
  assert.strictEqual(minutesOnDay(at, "2024-08-13"), 0, "started the day before");
  assert.strictEqual(minutesOnDay(at, "2024-08-11"), 24 * 60, "starts the day after");
}

async function testScheduleWritesEvent() {
  setToday(MONDAY);
  const task = await insertTask({ title: "Budget", scheduledFor: MONDAY });
  await useAppStore.getState().scheduleTask(task.id, "15:10", 90);
  await settle();

  const saved = await getTask(task.id);
  assert.strictEqual(saved?.startTime, "15:10");
  assert.strictEqual(saved?.durationMin, 90);
  const event = fake.slate.get(saved!.calendarEventId!);
  assert.ok(event, "an event in the Slate calendar");
  assert.strictEqual(event.title, "Budget");
  assert.strictEqual(minutesOnDay(event.startDate, MONDAY), h("15:10"));
  assert.strictEqual(minutesOnDay(event.endDate, MONDAY), h("16:40"));
  assert.deepStrictEqual(alarms.get(event.id), [{ relativeOffset: 0 }], "alert at the start");

  // Rescheduling moves the same event
  await useAppStore.getState().scheduleTask(task.id, "18:00", 90);
  await settle();
  const moved = await getTask(task.id);
  assert.strictEqual(moved?.calendarEventId, saved!.calendarEventId);
  assert.strictEqual(fake.slate.size, 1);
  assert.strictEqual(minutesOnDay(fake.slate.get(moved!.calendarEventId!)!.startDate, MONDAY), h("18:00"));

  // Clearing the time removes it
  await useAppStore.getState().scheduleTask(task.id, null);
  await settle();
  assert.strictEqual(fake.slate.size, 0);
  assert.strictEqual((await getTask(task.id))?.calendarEventId, null);
}

async function testMovingDayClearsSlotAndEvent() {
  setToday(MONDAY);
  const snoozed = await insertTask({ scheduledFor: MONDAY });
  const toSlate = await insertTask({ scheduledFor: MONDAY });
  const edited = await insertTask({ scheduledFor: MONDAY });
  const retitled = await insertTask({ scheduledFor: MONDAY });
  for (const t of [snoozed, toSlate, edited, retitled]) {
    await useAppStore.getState().scheduleTask(t.id, "17:00", 30);
  }
  await settle();
  assert.strictEqual(fake.slate.size, 4);

  await useAppStore.getState().skipTaskForToday(snoozed.id);
  await useAppStore.getState().sendTaskBackToSlate(toSlate.id);
  await useAppStore.getState().updateTask(edited.id, { scheduledFor: "2024-08-14" });
  await useAppStore.getState().updateTask(retitled.id, { title: "New name", scheduledFor: MONDAY });
  await settle();

  for (const t of [snoozed, toSlate, edited]) {
    const saved = await getTask(t.id);
    assert.strictEqual(saved?.startTime, null, "a slot belongs to its day");
    assert.strictEqual(saved?.calendarEventId, null);
  }
  const kept = await getTask(retitled.id);
  assert.strictEqual(kept?.startTime, "17:00", "same day keeps the slot");
  assert.strictEqual(fake.slate.size, 1);
  assert.strictEqual(fake.slate.get(kept!.calendarEventId!)!.title, "New name");
}

async function testDoneTaskEventIsTicked() {
  setToday(MONDAY);
  const task = await insertTask({ title: "Call Mom", scheduledFor: MONDAY });
  await useAppStore.getState().scheduleTask(task.id, "17:00", 30);
  await useAppStore.getState().completeTask(task.id);
  await settle();
  const saved = await getTask(task.id);
  assert.strictEqual(fake.slate.get(saved!.calendarEventId!)!.title, "✓ Call Mom");
  assert.deepStrictEqual(alarms.get(saved!.calendarEventId!), [], "no alert once it's done");

  await useAppStore.getState().undoCompleteTask(task.id);
  await settle();
  assert.strictEqual(fake.slate.get(saved!.calendarEventId!)!.title, "Call Mom");
  assert.deepStrictEqual(alarms.get(saved!.calendarEventId!), [{ relativeOffset: 0 }]);
}

async function testReconcilePullsMovesAndDeletes() {
  setToday(MONDAY);
  const dragged = await insertTask({ scheduledFor: MONDAY });
  const removed = await insertTask({ scheduledFor: MONDAY });
  const tomorrow = await insertTask({ scheduledFor: MONDAY });
  await useAppStore.getState().scheduleTask(dragged.id, "17:00", 30);
  await useAppStore.getState().scheduleTask(removed.id, "18:00", 30);
  await useAppStore.getState().scheduleTask(tomorrow.id, "19:00", 30);
  await settle();

  assert.strictEqual(await reconcile(MONDAY), false, "nothing moved yet");

  // In Calendar: drag one later and longer, delete one, move one to tomorrow
  const ev = async (id: string) => fake.slate.get((await getTask(id))!.calendarEventId!)!;
  const e1 = await ev(dragged.id);
  e1.startDate = dateAt(MONDAY, h("19:30"));
  e1.endDate = dateAt(MONDAY, h("20:15"));
  fake.slate.delete((await getTask(removed.id))!.calendarEventId!);
  const e3 = await ev(tomorrow.id);
  e3.startDate = dateAt("2024-08-13", h("08:00"));
  e3.endDate = dateAt("2024-08-13", h("08:30"));

  assert.strictEqual(await reconcile(MONDAY), true);
  const a = await getTask(dragged.id);
  assert.strictEqual(a?.startTime, "19:30");
  assert.strictEqual(a?.durationMin, 45);
  const b = await getTask(removed.id);
  assert.strictEqual(b?.startTime, null);
  assert.strictEqual(b?.calendarEventId, null);
  assert.strictEqual(b?.scheduledFor, MONDAY, "still today, just without a time");
  const c = await getTask(tomorrow.id);
  assert.strictEqual(c?.scheduledFor, "2024-08-13");
  assert.strictEqual(c?.startTime, "08:00");
}

async function testRolloverDropsSlotAndReconcileRemovesEvent() {
  setToday(MONDAY);
  await storage.setItem("last_processed_date", MONDAY);
  const open = await insertTask({ scheduledFor: MONDAY });
  const done = await insertTask({ scheduledFor: MONDAY });
  await useAppStore.getState().scheduleTask(open.id, "17:00", 30);
  await useAppStore.getState().scheduleTask(done.id, "18:00", 30);
  await useAppStore.getState().completeTask(done.id);
  await settle();

  await processRollover("2024-08-13");
  const carried = await getTask(open.id);
  assert.strictEqual(carried?.scheduledFor, "2024-08-13");
  assert.strictEqual(carried?.startTime, null, "yesterday's time doesn't carry");

  await reconcile("2024-08-13");
  assert.strictEqual((await getTask(open.id))?.calendarEventId, null);
  assert.strictEqual(fake.slate.size, 1, "the finished task's block stays as a record");
}

async function testNoAccessKeepsSlotsInSlate() {
  setToday(MONDAY);
  fake.access = "denied";
  const task = await insertTask({ scheduledFor: MONDAY });
  await useAppStore.getState().scheduleTask(task.id, "17:00", 30);
  await syncTask(task.id);
  assert.strictEqual((await getTask(task.id))?.startTime, "17:00");
  assert.strictEqual(fake.slate.size, 0);
  assert.deepStrictEqual(await loadDayEvents(MONDAY), []);
}

async function testDayEventsExcludeSlateCalendar() {
  setToday(MONDAY);
  const task = await insertTask({ scheduledFor: MONDAY });
  await useAppStore.getState().scheduleTask(task.id, "17:00", 30);
  await settle();
  const base = { allDay: false, calendarId: "home", calendarTitle: "Home", color: "#5B7FA8" };
  fake.others = [
    { ...base, id: "dentist", title: "Dentist", startDate: dateAt(MONDAY, h("16:00")), endDate: dateAt(MONDAY, h("16:45")) },
    { ...base, id: "trip", title: "Trip", allDay: true, startDate: dateAt(MONDAY, 0), endDate: dateAt(MONDAY, 24 * 60) },
    { ...base, id: "late", title: "Late show", startDate: dateAt(MONDAY, h("23:00")), endDate: dateAt("2024-08-13", h("01:00")) },
  ];
  const events = await loadDayEvents(MONDAY);
  assert.deepStrictEqual(
    events.map((e) => [e.title, e.start, e.end]),
    [
      ["Trip", 0, 24 * 60],
      ["Dentist", h("16:00"), h("16:45")],
      ["Late show", h("23:00"), 24 * 60],
    ]
  );
}

// A "Just to see" calendar (someone else's schedule) shows but doesn't block time;
// a hidden one is left out; calendars not listed block time as before
async function testCalendarModes() {
  setToday(SATURDAY);
  const at = (hhmm: string) => dateAt(SATURDAY, h(hhmm));
  const ev = (id: string, calendarId: string, from: string, to: string) => ({
    id, title: id, allDay: false, calendarId, calendarTitle: calendarId, color: "#5B7FA8",
    startDate: at(from), endDate: at(to),
  });
  fake.others = [
    ev("dentist", "home", "10:00", "11:00"),
    ev("class", "erin", "12:00", "15:00"),
    ev("secret", "old", "16:00", "17:00"),
  ];
  const modes = parseCalendarModes(JSON.stringify({ erin: "visible", old: "hidden" }));
  const events = await loadDayEvents(SATURDAY, modes);
  assert.deepStrictEqual(events.map((e) => [e.title, e.busy]), [["dentist", true], ["class", false]]);

  const busy = events.filter((e) => e.busy);
  const gaps = freeGaps(busy, DEFAULT_SCHEDULE, workBlock(SATURDAY, DEFAULT_SCHEDULE));
  assert.deepStrictEqual(gaps, [
    { start: h("08:00"), end: h("10:00") },
    { start: h("11:00"), end: h("22:00") },
  ], "Erin's class time stays free to plan");

  assert.deepStrictEqual(parseCalendarModes(null), {});
  assert.deepStrictEqual(parseCalendarModes("not json"), {});
}
