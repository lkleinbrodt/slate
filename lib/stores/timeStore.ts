import { getToday } from "@/lib/logic/dates";
import { processRollover } from "@/lib/logic/rollover";
import { rescheduleAllNotifications } from "@/lib/services/notifications";
import { AppState, AppStateStatus } from "react-native";
import { create } from "zustand";
import { useAppStore } from "./appStore";
import { useSettingsStore } from "./settings";

interface TimeState {
  currentDate: string;
  isInitialized: boolean;

  // Actions
  initialize: () => () => void; // Returns cleanup function
  checkAndUpdateIfNeeded: () => Promise<void>;
  getCurrentDate: () => string;
}

/**
 * Centralized TimeStore that powers the entire app's sense of "when" it is.
 * 
 * Key features:
 * - Reactive currentDate that updates when app comes to foreground
 * - Automatically checks for date boundary crossings (midnight/day start)
 * - Triggers rollover and data refresh when date changes
 * - Subscribes to AppState to detect foreground/background transitions
 * 
 * This fixes the "Tuesday forever" bug by ensuring the app always knows the current date.
 */
export const useTimeStore = create<TimeState>((set, get) => {
  const checkAndUpdateIfNeeded = async () => {
    const dayStart = useSettingsStore.getState().dayStart;
    const newDate = getToday(dayStart);
    const currentDate = get().currentDate;

    // If date changed, trigger rollover and refresh
    if (currentDate !== newDate) {
      console.log(
        `[TimeStore] Date changed: ${currentDate} -> ${newDate}, triggering rollover`
      );
      
      set({ currentDate: newDate });
      
      // Process rollover for the new date
      await processRollover(newDate);
      
      // Refresh app data
      const appStore = useAppStore.getState();
      if (appStore.isInitialized) {
        await appStore.refreshData();
      }
    }
  };

  return {
    currentDate: getToday(useSettingsStore.getState().dayStart),
    isInitialized: false,

    initialize: () => {
      const dayStart = useSettingsStore.getState().dayStart;
      const today = getToday(dayStart);
      
      set({
        currentDate: today,
        isInitialized: true,
      });

      // Set up AppState listener to check date when app comes to foreground
      const appStateSubscription = AppState.addEventListener(
        "change",
        async (state: AppStateStatus) => {
          if (state === "active") {
            console.log("[TimeStore] App became active, checking date");
            await get().checkAndUpdateIfNeeded();
            // Reschedule notifications when app comes to foreground
            const settings = useSettingsStore.getState();
            if (settings.notificationPermissionStatus === "granted") {
              await rescheduleAllNotifications();
            }
          }
        }
      );

      // Also check periodically (every minute) in case app is open during midnight
      // This handles the case where user has app open when day boundary crosses
      const intervalId = setInterval(() => {
        get().checkAndUpdateIfNeeded();
      }, 60000); // Check every minute

      // Return cleanup function
      return () => {
        appStateSubscription.remove();
        clearInterval(intervalId);
      };
    },

    checkAndUpdateIfNeeded: async () => {
      await checkAndUpdateIfNeeded();
    },

    getCurrentDate: () => {
      return get().currentDate;
    },
  };
});

