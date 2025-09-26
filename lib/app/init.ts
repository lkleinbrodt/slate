import { getMeta, setMeta } from "@/lib/db/dal";

import { initializeDatabase } from "../db/connection";
import { localToday } from "../utils/clock";
import { useSettingsStore } from "../stores/settings";
import { useSlateStore } from "../stores/slateStore";

/**
 * Initialize the app - call this on app start
 */
export async function initializeApp() {
  try {
    // Initialize database
    await initializeDatabase();

    // Load settings first
    await useSettingsStore.getState().loadSettings();

    // Get day start setting for rollover logic
    const dayStart = useSettingsStore.getState().dayStart;
    const today = localToday(dayStart);

    // Check if we need to run rollover
    await runRolloverIfNeeded(today, dayStart);

    // Initialize unified slate store from event log
    await useSlateStore.getState().actions.init();

    console.log("App initialized successfully");
  } catch (error) {
    console.error("App initialization failed:", error);
    throw error;
  }
}

/**
 * Run rollover logic if day boundary has been crossed
 * In the new event-sourced architecture, rollover logic will be handled by replaying events
 * and potentially adding new events (e.g., TASK_CARRIED_OVER)
 */
async function runRolloverIfNeeded(today: string, dayStart: string) {
  try {
    const lastOpenDate = await getMeta("last_open_date");

    if (!lastOpenDate || lastOpenDate === today) {
      // No rollover needed
      await setMeta("last_open_date", today);
      return;
    }

    console.log(`Day boundary crossed: ${lastOpenDate} -> ${today}`);

    // In the new event-sourced architecture, rollover logic will be handled by replaying events
    // and potentially adding new events (e.g., TASK_CARRIED_OVER)
    // For now, we'll just update the last_open_date
    await setMeta("last_open_date", today);

    // The concept of "perfect day" and "day snapshots" will also be derived from the event log
    // and might involve adding specific events or recalculating state.
    // For now, these old DAL calls are removed.
  } catch (error) {
    console.error("Rollover failed:", error);
    // Don't throw - rollover failure shouldn't prevent app startup
  }
}

/**
 * Get app ready state
 */
export function isAppReady(): boolean {
  const settingsState = useSettingsStore.getState();
  const slateState = useSlateStore.getState();

  return !settingsState.loading && slateState.isInitialized;
}
