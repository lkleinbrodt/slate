import { create } from "zustand";

import * as cal from "@/lib/services/calendar";
import { type DayEvent, loadDayEvents, reconcile, syncTask } from "@/lib/services/calendarSync";
import { useAppStore } from "./appStore";
import { useTimeStore } from "./timeStore";

interface CalendarState {
  access: cal.CalendarAccess | null;
  // Today's events from your own calendars (not Slate's)
  events: DayEvent[];
  eventsDate: string | null;
  /** Pull Calendar changes into tasks, then reload today's events */
  refresh: () => Promise<void>;
  requestAccess: () => Promise<void>;
}

// Overlapping refreshes (mount + foreground) share one run
let inFlight: Promise<void> | null = null;

export const useCalendarStore = create<CalendarState>((set, get) => ({
  access: null,
  events: [],
  eventsDate: null,

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
        if (await reconcile(today)) await useAppStore.getState().refreshData();
        set({ events: await loadDayEvents(today), eventsDate: today });
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
}));
