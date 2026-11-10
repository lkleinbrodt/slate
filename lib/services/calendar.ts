/**
 * The iOS calendar, through expo-calendar. Thin on purpose: the rules for what to write
 * live in calendarSync.ts, which tests run against a fake of this module.
 *
 * Slate reads every calendar on the phone and writes only to its own, "Slate", which it
 * creates the first time it needs it.
 */
import * as Calendar from "expo-calendar";
import * as repo from "@/lib/logic/repo";

export type CalendarAccess = "granted" | "denied" | "undetermined";

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  calendarId: string;
  calendarTitle: string;
  color: string;
}

export interface EventDetails {
  title: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
}

const SLATE_CALENDAR = "Slate";
// constants/theme.ts primary
const SLATE_COLOR = "#D2632F";
const CALENDAR_ID_SETTING = "slate_calendar_id";

let access: CalendarAccess | null = null;
let slateCalendarId: string | null = null;

const toAccess = (r: Calendar.PermissionResponse): CalendarAccess =>
  r.granted ? "granted" : r.canAskAgain ? "undetermined" : "denied";

export async function getAccess(): Promise<CalendarAccess> {
  access = toAccess(await Calendar.getCalendarPermissionsAsync());
  return access;
}

export async function requestAccess(): Promise<CalendarAccess> {
  access = toAccess(await Calendar.requestCalendarPermissionsAsync());
  return access;
}

/** Cached after the first check; Settings re-checks when it opens */
export async function hasAccess(): Promise<boolean> {
  return (access ?? (await getAccess())) === "granted";
}

/** Events from every calendar except Slate's own, overlapping [start, end) */
export async function listEvents(start: Date, end: Date): Promise<CalendarEvent[]> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const slateId = await findSlateCalendar(calendars);
  const others = calendars.filter((c) => c.id !== slateId);
  if (!others.length) return [];
  const byId = new Map(others.map((c) => [c.id, c]));
  const events = await Calendar.getEventsAsync(
    others.map((c) => c.id),
    start,
    end
  );
  return events.map((e) => {
    const cal = byId.get(e.calendarId);
    return {
      id: e.id,
      title: e.title,
      startDate: new Date(e.startDate),
      endDate: new Date(e.endDate),
      allDay: e.allDay,
      calendarId: e.calendarId,
      calendarTitle: cal?.title ?? "",
      color: cal?.color ?? SLATE_COLOR,
    };
  });
}

/** null when the event no longer exists (deleted in Calendar) */
export async function getEvent(id: string): Promise<CalendarEvent | null> {
  try {
    const e = await Calendar.getEventAsync(id);
    if (!e) return null;
    return {
      id: e.id,
      title: e.title,
      startDate: new Date(e.startDate),
      endDate: new Date(e.endDate),
      allDay: e.allDay,
      calendarId: e.calendarId,
      calendarTitle: SLATE_CALENDAR,
      color: SLATE_COLOR,
    };
  } catch {
    return null;
  }
}

/** Updates the event if `id` still exists, otherwise creates one. Returns its id. */
export async function saveEvent(id: string | null, details: EventDetails): Promise<string> {
  if (id) {
    try {
      await Calendar.updateEventAsync(id, details);
      return id;
    } catch {
      // Deleted in Calendar since; make a new one
    }
  }
  const calendarId = await ensureSlateCalendar();
  return Calendar.createEventAsync(calendarId, details);
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    await Calendar.deleteEventAsync(id);
  } catch {
    // Already gone
  }
}

async function findSlateCalendar(
  calendars?: Calendar.Calendar[]
): Promise<string | null> {
  const list = calendars ?? (await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT));
  slateCalendarId ??= await repo.getSetting(CALENDAR_ID_SETTING);
  if (slateCalendarId && list.some((c) => c.id === slateCalendarId)) return slateCalendarId;
  // The stored one is gone (or never stored): adopt one by name, as after a reinstall
  const named = list.find((c) => c.title === SLATE_CALENDAR && c.allowsModifications);
  slateCalendarId = named?.id ?? null;
  if (slateCalendarId) await repo.setSetting(CALENDAR_ID_SETTING, slateCalendarId);
  return slateCalendarId;
}

async function ensureSlateCalendar(): Promise<string> {
  const existing = await findSlateCalendar();
  if (existing) return existing;
  // Same account as the default calendar (iCloud, usually), so it syncs to the Mac
  // and Watch; a local calendar only where there's no default
  const source =
    (await Calendar.getDefaultCalendarAsync().catch(() => null))?.source ??
    (await Calendar.getSourcesAsync()).find((s) => s.type === Calendar.SourceType.LOCAL);
  if (!source) throw new Error("No calendar account to create the Slate calendar in");
  const id = await Calendar.createCalendarAsync({
    title: SLATE_CALENDAR,
    color: SLATE_COLOR,
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: source.id,
    source,
    name: SLATE_CALENDAR,
    ownerAccount: "personal",
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
  slateCalendarId = id;
  await repo.setSetting(CALENDAR_ID_SETTING, id);
  return id;
}
