import { Platform } from "react-native";

import { WIDGET_APP_GROUP } from "@/lib/constants/app";
import { buildWidgetSnapshot } from "@/lib/logic/widget";
import { useAppStore } from "@/lib/stores/appStore";
import { useSettingsStore } from "@/lib/stores/settings";
import { useTimeStore } from "@/lib/stores/timeStore";

// Must match WidgetKit `kind` and the key read in targets/widget/Snapshot.swift
const WIDGET_KIND = "SlateToday";
const SNAPSHOT_KEY = "widgetSnapshot";

// Toggles come in bursts (optimistic update, then refresh); write once
const DEBOUNCE_MS = 400;

function writeSnapshot() {
  // Required lazily: the module touches the `expo` global as soon as it loads
  const { ExtensionStorage } =
    require("@bacons/apple-targets") as typeof import("@bacons/apple-targets");
  const app = useAppStore.getState();
  const snapshot = buildWidgetSnapshot({
    today: useTimeStore.getState().getCurrentDate(),
    dayStart: useSettingsStore.getState().dayStart,
    todayTasks: app.todayTasks,
    activeHabits: app.activeHabits,
    todaysHabitCompletions: app.todaysHabitCompletions,
    openTasks: app.slateTasks,
  });
  new ExtensionStorage(WIDGET_APP_GROUP).set(SNAPSHOT_KEY, JSON.stringify(snapshot));
  ExtensionStorage.reloadWidget(WIDGET_KIND);
}

/**
 * Keep the home/lock screen widget in step with Today. Call once after the app
 * store is initialized; returns an unsubscribe function.
 */
export function startWidgetSync(): () => void {
  if (Platform.OS !== "ios") return () => {};
  // Without the native module, ExtensionStorage quietly does nothing. That
  // happens if autolinking skips its pod (it needs iOS 16.4+; see app.json).
  if (!globalThis.expo?.modules?.ExtensionStorage) {
    console.warn("Widget: ExtensionStorage native module is missing; snapshots won't be written");
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        writeSnapshot();
      } catch (err) {
        console.error("Failed to update widget", err);
      }
    }, DEBOUNCE_MS);
  };

  // Everything the snapshot reads; any change rewrites it
  const unsubscribeApp = useAppStore.subscribe((state, prev) => {
    if (
      state.todayTasks !== prev.todayTasks ||
      state.activeHabits !== prev.activeHabits ||
      state.todaysHabitCompletions !== prev.todaysHabitCompletions ||
      state.slateTasks !== prev.slateTasks
    ) {
      schedule();
    }
  });
  const unsubscribeSettings = useSettingsStore.subscribe((state, prev) => {
    if (state.dayStart !== prev.dayStart) schedule();
  });

  schedule();

  return () => {
    clearTimeout(timer);
    unsubscribeApp();
    unsubscribeSettings();
  };
}
