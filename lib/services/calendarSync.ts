/**
 * Keeps each task's time slot and its event in the "Slate" calendar in step.
 *
 * The database is the source of truth for slots set in Slate: `syncTask` writes them out
 * after every change. Calendar is the source of truth for moves made there: `reconcile`
 * reads Slate's events back on launch and foreground, so dragging a block in Calendar
 * moves the task, and deleting the block takes the task's time away. `reconcile` also
 * deletes events whose task lost its slot without a sync (rollover, an app kill).
 *
 * Calls run one at a time, so a reconcile never reads an event a sync is rewriting.
 * Without calendar access everything here is a no-op; slots still work inside Slate.
 */
import * as cal from "@/lib/services/calendar";
import * as repo from "@/lib/logic/repo";

import { dateAt, minutesOnDay, taskInterval, toHHmm } from "@/lib/logic/schedule";
import dayjs from "dayjs";

let queue: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.catch(() => {});
  return next;
}

export const eventTitle = (task: repo.Task) =>
  task.status === "done" ? `✓ ${task.title}` : task.title;

/** Write one task's slot to Calendar: create, move or delete its event */
export function syncTask(taskId: string): Promise<void> {
  return serial(async () => {
    if (await cal.hasAccess()) await writeTask(taskId);
  });
}

async function writeTask(taskId: string) {
  const task = await repo.getTask(taskId);
  if (!task) return;
  const slot = taskInterval(task);
  if (task.status !== "archived" && task.scheduledFor && slot) {
    const id = await cal.saveEvent(task.calendarEventId, {
      title: eventTitle(task),
      startDate: dateAt(task.scheduledFor, slot.start),
      endDate: dateAt(task.scheduledFor, slot.end),
      notes: task.notes ?? undefined,
    });
    if (id !== task.calendarEventId) await repo.updateTask(task.id, { calendarEventId: id });
  } else if (task.calendarEventId) {
    await cal.deleteEvent(task.calendarEventId);
    await repo.updateTask(task.id, { calendarEventId: null });
  }
}

/** Fire-and-forget version for store actions */
export function syncTaskSoon(taskId: string) {
  syncTask(taskId).catch((err) => console.error("Calendar sync failed", err));
}

/**
 * Pull moves and deletions made in Calendar back into tasks, and remove events whose
 * task no longer has a slot. Returns true if any task changed.
 */
export function reconcile(today: string): Promise<boolean> {
  return serial(async () => {
    if (!(await cal.hasAccess())) return false;
    let changed = false;
    for (const task of await repo.listTasksWithEvents()) {
      const eventId = task.calendarEventId!;
      if (task.status === "archived" || !task.scheduledFor || !task.startTime) {
        await cal.deleteEvent(eventId);
        await repo.updateTask(task.id, { calendarEventId: null });
        continue;
      }
      // Finished tasks keep their block as a record; past days are left alone
      if (task.status === "done" || task.scheduledFor < today) continue;

      const event = await cal.getEvent(eventId);
      if (!event) {
        await repo.updateTask(task.id, { startTime: null, calendarEventId: null });
        changed = true;
        continue;
      }
      const date = dayjs(event.startDate).format("YYYY-MM-DD");
      // Dragged into the past or made all-day: not a slot Slate can use, so put it back
      if (event.allDay || date < today) {
        await cal.deleteEvent(eventId);
        await repo.updateTask(task.id, { calendarEventId: null });
        await writeTask(task.id);
        continue;
      }
      const start = minutesOnDay(event.startDate, date);
      const end = Math.max(start + 5, minutesOnDay(event.endDate, date));
      const startTime = toHHmm(start);
      const durationMin = end - start;
      const current = taskInterval(task)!;
      if (
        date !== task.scheduledFor ||
        start !== current.start ||
        durationMin !== current.end - current.start
      ) {
        await repo.updateTask(task.id, { scheduledFor: date, startTime, durationMin });
        changed = true;
      }
    }
    return changed;
  });
}

/** Today's events from your own calendars, as minutes on the day */
export interface DayEvent {
  id: string;
  title: string;
  start: number;
  end: number;
  allDay: boolean;
  calendarTitle: string;
  color: string;
}

export async function loadDayEvents(date: string): Promise<DayEvent[]> {
  if (!(await cal.hasAccess())) return [];
  const events = await cal.listEvents(dateAt(date, 0), dateAt(date, 24 * 60));
  return events
    .map((e) => ({
      id: e.id,
      title: e.title,
      start: e.allDay ? 0 : minutesOnDay(e.startDate, date),
      end: e.allDay ? 24 * 60 : minutesOnDay(e.endDate, date),
      allDay: e.allDay,
      calendarTitle: e.calendarTitle,
      color: e.color,
    }))
    .filter((e) => e.allDay || e.end > e.start)
    .sort((a, b) => a.start - b.start);
}
