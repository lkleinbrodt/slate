import * as repo from "@/lib/logic/repo";

import { DEFAULT_PLAN_MODEL } from "@/lib/voice/planDay/extract";
import { DEFAULT_SCHEDULE, type ScheduleSettings } from "@/lib/logic/schedule";
import { DEFAULT_THREEPIO_URL, type VoiceProvider } from "@/lib/voice/threepio";

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
  // The character last called (a Threepio id); null until the first call
  voiceCharacter: string | null;
  // OpenRouter model that turns a call into a plan
  planModel: string;
  // Whose voice the character speaks with: "pocket" is local on chewy, "fish" is cloud
  voiceProvider: VoiceProvider;

  // Time slots (lib/logic/schedule.ts): when Slate may place tasks, and the work block
  // (weekdays) it keeps clear
  schedule: ScheduleSettings;
  // A day (YYYY-MM-DD) marked off work, so its work block is free
  workDayOff: string | null;

  loadSettings: () => Promise<void>;
  updateDayStart: (time: string) => Promise<void>;
  updatePlanYourDaySettings: (enabled: boolean, time: string) => Promise<void>;
  updateHabitReminderSettings: (enabled: boolean, interval: number) => Promise<void>;
  updateHabitReminderWindow: (start: string, end: string) => Promise<void>;
  updateNightReviewSettings: (enabled: boolean, time: string) => Promise<void>;
  setNotificationPermissionStatus: (status: NotificationPermissionStatus) => void;
  updateThreepioUrl: (url: string) => Promise<void>;
  updateVoiceCharacter: (id: string) => Promise<void>;
  updatePlanModel: (model: string) => Promise<void>;
  updateVoiceProvider: (provider: VoiceProvider) => Promise<void>;
  updateSchedule: (changes: Partial<Omit<ScheduleSettings, "workDays">>) => Promise<void>;
  setWorkDayOff: (date: string | null) => Promise<void>;
}

const SCHEDULE_KEYS = {
  windowStart: "schedule_window_start",
  windowEnd: "schedule_window_end",
  workStart: "schedule_work_start",
  workEnd: "schedule_work_end",
} as const;

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
  voiceCharacter: null as string | null,
  planModel: DEFAULT_PLAN_MODEL,
  voiceProvider: "pocket" as VoiceProvider,
  schedule: DEFAULT_SCHEDULE,
  workDayOff: null as string | null,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
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
      voiceCharacter,
      planModel,
      voiceProvider,
      windowStart,
      windowEnd,
      workStart,
      workEnd,
      workDayOff,
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
      repo.getSetting("voice_character"),
      repo.getSetting("voice_plan_model"),
      repo.getSetting("voice_provider"),
      repo.getSetting(SCHEDULE_KEYS.windowStart),
      repo.getSetting(SCHEDULE_KEYS.windowEnd),
      repo.getSetting(SCHEDULE_KEYS.workStart),
      repo.getSetting(SCHEDULE_KEYS.workEnd),
      repo.getSetting("schedule_work_day_off"),
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
      voiceCharacter: voiceCharacter || DEFAULT_SETTINGS.voiceCharacter,
      planModel: planModel || DEFAULT_SETTINGS.planModel,
      voiceProvider: voiceProvider === "fish" ? "fish" : DEFAULT_SETTINGS.voiceProvider,
      schedule: {
        ...DEFAULT_SCHEDULE,
        windowStart: windowStart || DEFAULT_SCHEDULE.windowStart,
        windowEnd: windowEnd || DEFAULT_SCHEDULE.windowEnd,
        workStart: workStart || DEFAULT_SCHEDULE.workStart,
        workEnd: workEnd || DEFAULT_SCHEDULE.workEnd,
      },
      workDayOff: workDayOff || null,
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

  updateVoiceCharacter: async (id: string) => {
    await repo.setSetting("voice_character", id);
    set({ voiceCharacter: id });
  },

  updateVoiceProvider: async (provider: VoiceProvider) => {
    await repo.setSetting("voice_provider", provider);
    set({ voiceProvider: provider });
  },

  updatePlanModel: async (model: string) => {
    await repo.setSetting("voice_plan_model", model);
    set({ planModel: model });
  },

  updateSchedule: async (changes) => {
    await Promise.all(
      (Object.keys(changes) as (keyof typeof SCHEDULE_KEYS)[]).map((k) =>
        repo.setSetting(SCHEDULE_KEYS[k], changes[k]!)
      )
    );
    set({ schedule: { ...get().schedule, ...changes } });
  },

  setWorkDayOff: async (date) => {
    await repo.setSetting("schedule_work_day_off", date ?? "");
    set({ workDayOff: date });
  },
}));
