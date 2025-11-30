import * as repo from "@/lib/logic/repo";

import { create } from "zustand";

type NotificationPermissionStatus = "undetermined" | "granted" | "denied";

interface SettingsState {
  dayStart: string;
  loading: boolean;
  
  // Notification settings
  planYourDayEnabled: boolean;
  planYourDayTime: string;
  habitRemindersEnabled: boolean;
  habitReminderInterval: number; // in hours
  nightReviewEnabled: boolean;
  nightReviewTime: string;
  notificationPermissionStatus: NotificationPermissionStatus;
  
  loadSettings: () => Promise<void>;
  updateDayStart: (time: string) => Promise<void>;
  updatePlanYourDaySettings: (enabled: boolean, time: string) => Promise<void>;
  updateHabitReminderSettings: (enabled: boolean, interval: number) => Promise<void>;
  updateNightReviewSettings: (enabled: boolean, time: string) => Promise<void>;
  setNotificationPermissionStatus: (status: NotificationPermissionStatus) => void;
}

const DEFAULT_SETTINGS = {
  dayStart: "04:00",
  planYourDayEnabled: true,
  planYourDayTime: "07:00",
  habitRemindersEnabled: true,
  habitReminderInterval: 4,
  nightReviewEnabled: true,
  nightReviewTime: "20:00",
  notificationPermissionStatus: "undetermined" as NotificationPermissionStatus,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  ...DEFAULT_SETTINGS,
  loading: true,

  loadSettings: async () => {
    set({ loading: true });
    const [
      dayStart,
      planYourDayEnabled,
      planYourDayTime,
      habitRemindersEnabled,
      habitReminderInterval,
      nightReviewEnabled,
      nightReviewTime,
    ] = await Promise.all([
      repo.getSetting("day_start"),
      repo.getSetting("notification_plan_day_enabled"),
      repo.getSetting("notification_plan_day_time"),
      repo.getSetting("notification_habit_reminders_enabled"),
      repo.getSetting("notification_habit_reminder_interval"),
      repo.getSetting("notification_night_review_enabled"),
      repo.getSetting("notification_night_review_time"),
    ]);
    
    set({
      dayStart: dayStart || DEFAULT_SETTINGS.dayStart,
      planYourDayEnabled: planYourDayEnabled === "true" || (planYourDayEnabled === null && DEFAULT_SETTINGS.planYourDayEnabled),
      planYourDayTime: planYourDayTime || DEFAULT_SETTINGS.planYourDayTime,
      habitRemindersEnabled: habitRemindersEnabled === "true" || (habitRemindersEnabled === null && DEFAULT_SETTINGS.habitRemindersEnabled),
      habitReminderInterval: habitReminderInterval ? parseInt(habitReminderInterval, 10) : DEFAULT_SETTINGS.habitReminderInterval,
      nightReviewEnabled: nightReviewEnabled === "true" || (nightReviewEnabled === null && DEFAULT_SETTINGS.nightReviewEnabled),
      nightReviewTime: nightReviewTime || DEFAULT_SETTINGS.nightReviewTime,
      loading: false,
    });
  },

  updateDayStart: async (time: string) => {
    await repo.setSetting("day_start", time);
    set({ dayStart: time });
  },

  updatePlanYourDaySettings: async (enabled: boolean, time: string) => {
    await Promise.all([
      repo.setSetting("notification_plan_day_enabled", enabled.toString()),
      repo.setSetting("notification_plan_day_time", time),
    ]);
    set({ planYourDayEnabled: enabled, planYourDayTime: time });
  },

  updateHabitReminderSettings: async (enabled: boolean, interval: number) => {
    await Promise.all([
      repo.setSetting("notification_habit_reminders_enabled", enabled.toString()),
      repo.setSetting("notification_habit_reminder_interval", interval.toString()),
    ]);
    set({ habitRemindersEnabled: enabled, habitReminderInterval: interval });
  },

  updateNightReviewSettings: async (enabled: boolean, time: string) => {
    await Promise.all([
      repo.setSetting("notification_night_review_enabled", enabled.toString()),
      repo.setSetting("notification_night_review_time", time),
    ]);
    set({ nightReviewEnabled: enabled, nightReviewTime: time });
  },

  setNotificationPermissionStatus: (status: NotificationPermissionStatus) => {
    set({ notificationPermissionStatus: status });
  },
}));
