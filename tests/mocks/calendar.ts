// In-memory stand-in for lib/services/calendar.ts (expo-calendar). Tests reach in
// through `fake` to grant access, add events, and move or delete Slate's blocks.
import type { CalendarAccess, CalendarEvent, EventDetails } from "@/lib/services/calendar";

export type { CalendarAccess, CalendarEvent, EventDetails };

let nextId = 1;
export const fake = {
  access: "granted" as CalendarAccess,
  // Slate's own calendar
  slate: new Map<string, CalendarEvent>(),
  // Everything else on the phone
  others: [] as CalendarEvent[],
  reset() {
    this.access = "granted";
    this.slate.clear();
    this.others = [];
  },
};

export const getAccess = async () => fake.access;
export const requestAccess = async () => fake.access;
export const hasAccess = async () => fake.access === "granted";

export const listEvents = async (start: Date, end: Date) =>
  fake.others.filter((e) => e.startDate < end && e.endDate > start);

export const getEvent = async (id: string) => fake.slate.get(id) ?? null;

export const saveEvent = async (id: string | null, details: EventDetails) => {
  const eventId = id && fake.slate.has(id) ? id : `ev${nextId++}`;
  fake.slate.set(eventId, {
    id: eventId,
    title: details.title,
    startDate: details.startDate,
    endDate: details.endDate,
    allDay: false,
    calendarId: "slate",
    calendarTitle: "Slate",
    color: "#D2632F",
  });
  return eventId;
};

export const deleteEvent = async (id: string) => {
  fake.slate.delete(id);
};
