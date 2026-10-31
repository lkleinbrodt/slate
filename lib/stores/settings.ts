import * as repo from "@/lib/logic/repo";

import { DEFAULT_THREEPIO_URL } from "@/lib/voice/threepio";

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
  habitReminderStart: string; // HH:mm, first reminder of the day
  habitReminderEnd: string; // HH:mm, no reminders after this
  nightReviewEnabled: boolean;
  nightReviewTime: string;
  notificationPermissionStatus: NotificationPermissionStatus;

  // Voice (docs/voice.md): where Threepio, the voice service, is
  threepioUrl: string;

  loadSettings: () => Promise<void>;
  updateDayStart: (time: string) => Promise<void>;
  updatePlanYourDaySettings: (enabled: boolean, time: string) => Promise<void>;
  updateHabitReminderSettings: (enabled: boolean, interval: number) => Promise<void>;
  updateHabitReminderWindow: (start: string, end: string) => Promise<void>;
  updateNightReviewSettings: (enabled: boolean, time: string) => Promise<void>;
  setNotificationPermissionStatus: (status: NotificationPermissionStatus) => void;
  updateThreepioUrl: (url: string) => Promise<void>;
}

const DEFAULT_SETTINGS = {
  dayStart: "04:00",
  planYourDayEnabled: true,
  planYourDayTime: "07:00",
  habitRemindersEnabled: true,
  habitReminderInterval: 4,
  habitReminderStart: "10:00",
  habitReminderEnd: "20:00",
  nightReviewEnabled: true,
  nightReviewTime: "20:00",
  notificationPermissionStatus: "undetermined" as NotificationPermissionStatus,
  threepioUrl: DEFAULT_THREEPIO_URL,
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
      habitReminderStart,
      habitReminderEnd,
      nightReviewEnabled,
      nightReviewTime,
      threepioUrl,
    ] = await Promise.all([
      repo.getSetting("day_start"),
      repo.getSetting("notification_plan_day_enabled"),
      repo.getSetting("notification_plan_day_time"),
      repo.getSetting("notification_habit_reminders_enabled"),
      repo.getSetting("notification_habit_reminder_interval"),
      repo.getSetting("notification_habit_reminder_start"),
      repo.getSetting("notification_habit_reminder_end"),
      repo.getSetting("notification_night_review_enabled"),
      repo.getSetting("notification_night_review_time"),
      repo.getSetting("threepio_url"),
    ]);
    
    set({
      dayStart: dayStart || DEFAULT_SETTINGS.dayStart,
      planYourDayEnabled: planYourDayEnabled === "true" || (planYourDayEnabled === null && DEFAULT_SETTINGS.planYourDayEnabled),
      planYourDayTime: planYourDayTime || DEFAULT_SETTINGS.planYourDayTime,
      habitRemindersEnabled: habitRemindersEnabled === "true" || (habitRemindersEnabled === null && DEFAULT_SETTINGS.habitRemindersEnabled),
      habitReminderInterval: habitReminderInterval ? parseInt(habitReminderInterval, 10) : DEFAULT_SETTINGS.habitReminderInterval,
      habitReminderStart: habitReminderStart || DEFAULT_SETTINGS.habitReminderStart,
      habitReminderEnd: habitReminderEnd || DEFAULT_SETTINGS.habitReminderEnd,
      nightReviewEnabled: nightReviewEnabled === "true" || (nightReviewEnabled === null && DEFAULT_SETTINGS.nightReviewEnabled),
      nightReviewTime: nightReviewTime || DEFAULT_SETTINGS.nightReviewTime,
      threepioUrl: threepioUrl || DEFAULT_SETTINGS.threepioUrl,
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

  updateHabitReminderWindow: async (start: string, end: string) => {
    await Promise.all([
      repo.setSetting("notification_habit_reminder_start", start),
      repo.setSetting("notification_habit_reminder_end", end),
    ]);
    set({ habitReminderStart: start, habitReminderEnd: end });
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

  updateThreepioUrl: async (url: string) => {
    await repo.setSetting("threepio_url", url);
    set({ threepioUrl: url });
  },
}));
