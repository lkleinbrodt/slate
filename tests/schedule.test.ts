import assert from "assert";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/connection";
import { resetDatabase } from "./mocks/db-connection";
import { resetStorage } from "./mocks/kv-store";
import { fake } from "./mocks/calendar";
import { tasks } from "@/lib/db/schema";
import {
  DEFAULT_SCHEDULE,
  dateAt,
  freeGaps,
  minutesOnDay,
  planTasks,
  suggestSlots,
  toMinutes,
  workBlock,
} from "@/lib/logic/schedule";
import { loadDayEvents, reconcile, syncTask } from "@/lib/services/calendarSync";
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
  testWallClockConversions();
  await testScheduleWritesEvent();
  await testMovingDayClearsSlotAndEvent();
  await testDoneTaskEventIsTicked();
  await testReconcilePullsMovesAndDeletes();
  await testRolloverDropsSlotAndReconcileRemovesEvent();
  await testNoAccessKeepsSlotsInSlate();
  await testDayEventsExcludeSlateCalendar();
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

  await useAppStore.getState().undoCompleteTask(task.id);
  await settle();
  assert.strictEqual(fake.slate.get(saved!.calendarEventId!)!.title, "Call Mom");
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
