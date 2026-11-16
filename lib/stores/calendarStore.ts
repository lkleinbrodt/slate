import { create } from "zustand";

import * as cal from "@/lib/services/calendar";
import * as repo from "@/lib/logic/repo";
import {
  CALENDAR_MODES_SETTING,
  type CalendarMode,
  type CalendarModes,
  type DayEvent,
  loadDayEvents,
  parseCalendarModes,
  reconcile,
  syncTask,
} from "@/lib/services/calendarSync";
import { useAppStore } from "./appStore";
import { useTimeStore } from "./timeStore";

interface CalendarState {
  access: cal.CalendarAccess | null;
  // Today's events from your own calendars (not Slate's, not hidden ones)
  events: DayEvent[];
  eventsDate: string | null;
  // Your calendars, for Settings, and how Slate treats each (calendarSync.CalendarMode)
  calendars: cal.CalendarInfo[];
  modes: CalendarModes;
  /** Pull Calendar changes into tasks, then reload today's events */
  refresh: () => Promise<void>;
  requestAccess: () => Promise<void>;
  setCalendarMode: (calendarId: string, mode: CalendarMode) => Promise<void>;
}

// Overlapping refreshes (mount + foreground) share one run
let inFlight: Promise<void> | null = null;

export const useCalendarStore = create<CalendarState>((set, get) => ({
  access: null,
  events: [],
  eventsDate: null,
  calendars: [],
  modes: {},

  refresh: () => {
    inFlight ??= (async () => {
      try {
        const access = await cal.getAccess();
        set({ access });
        const today = useTimeStore.getState().getCurrentDate();
        if (access !== "granted") {
          set({ events: [], eventsDate: today });
          return;
        }
        const modes = parseCalendarModes(await repo.getSetting(CALENDAR_MODES_SETTING));
        if (await reconcile(today)) await useAppStore.getState().refreshData();
        const [events, calendars] = await Promise.all([
          loadDayEvents(today, modes),
          cal.listCalendars(),
        ]);
        set({ events, eventsDate: today, calendars, modes });
      } catch (err) {
        console.error("Calendar refresh failed", err);
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  },

  requestAccess: async () => {
    const access = await cal.requestAccess();
    set({ access });
    if (access === "granted") {
      // Slots set before access was given get their events now
      for (const task of useAppStore.getState().todayTasks) {
        if (task.startTime) await syncTask(task.id);
      }
      await get().refresh();
    }
  },

  setCalendarMode: async (calendarId, mode) => {
    const modes = { ...get().modes };
    // "busy" is the default; don't store it, so the setting only lists exceptions
    if (mode === "busy") delete modes[calendarId];
    else modes[calendarId] = mode;
    set({ modes });
    await repo.setSetting(CALENDAR_MODES_SETTING, JSON.stringify(modes));
    const today = useTimeStore.getState().getCurrentDate();
    set({ events: await loadDayEvents(today, modes), eventsDate: today });
  },
}));
