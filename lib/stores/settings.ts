import * as dal from "@/lib/db/dal";

import {
  ERROR_MESSAGES,
  createErrorState,
  createLoadingState,
  createSuccessState,
} from "@/lib/utils/errorHandling";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface SettingsState {
  dayStart: string; // HH:mm format
  autoCarryover: boolean;
  habitReminderTime: string; // HH:mm format
  eveningNudgeEnabled: boolean;
  taskReminderTime: string; // HH:mm format
  todayReminderEnabled: boolean;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateDayStart: (time: string) => Promise<void>;
  updateAutoCarryover: (enabled: boolean) => Promise<void>;
  updateHabitReminderTime: (time: string) => Promise<void>;
  updateEveningNudge: (enabled: boolean) => Promise<void>;
  updateTaskReminderTime: (time: string) => Promise<void>;
  updateTodayReminder: (enabled: boolean) => Promise<void>;
  updateHaptics: (enabled: boolean) => Promise<void>;
  updateSound: (enabled: boolean) => Promise<void>;
  setError: (error: string | null) => void;
}

const DEFAULT_SETTINGS = {
  dayStart: "04:00",
  autoCarryover: true,
  habitReminderTime: "08:00",
  eveningNudgeEnabled: false,
  taskReminderTime: "09:00",
  todayReminderEnabled: false,
  hapticsEnabled: true,
  soundEnabled: false,
};

export const useSettingsStore = create<SettingsState>()(
  devtools(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      loading: false,
      error: null,

      loadSettings: async () => {
        set(createLoadingState());
        try {
          const [
            dayStart,
            autoCarryover,
            habitReminderTime,
            eveningNudgeEnabled,
            taskReminderTime,
            todayReminderEnabled,
            hapticsEnabled,
            soundEnabled,
          ] = await Promise.all([
            dal.getMeta("day_start"),
            dal.getMeta("auto_carryover"),
            dal.getMeta("habit_reminder_time"),
            dal.getMeta("evening_nudge_enabled"),
            dal.getMeta("task_reminder_time"),
            dal.getMeta("today_reminder_enabled"),
            dal.getMeta("haptics_enabled"),
            dal.getMeta("sound_enabled"),
          ]);

          set({
            dayStart: dayStart || DEFAULT_SETTINGS.dayStart,
            autoCarryover: autoCarryover === "true",
            habitReminderTime:
              habitReminderTime || DEFAULT_SETTINGS.habitReminderTime,
            eveningNudgeEnabled: eveningNudgeEnabled === "true",
            taskReminderTime:
              taskReminderTime || DEFAULT_SETTINGS.taskReminderTime,
            todayReminderEnabled: todayReminderEnabled === "true",
            hapticsEnabled: hapticsEnabled !== "false", // default true
            soundEnabled: soundEnabled === "true",
            loading: false,
          });
        } catch (error) {
          set(createErrorState(error, ERROR_MESSAGES.LOAD_SETTINGS));
        }
      },

      updateDayStart: async (time) => {
        try {
          await dal.setMeta("day_start", time);
          set({ dayStart: time, ...createSuccessState() });
        } catch (error) {
          set(createErrorState(error, ERROR_MESSAGES.UPDATE_DAY_START));
        }
      },

      updateAutoCarryover: async (enabled) => {
        try {
          await dal.setMeta("auto_carryover", enabled.toString());
          set({ autoCarryover: enabled, ...createSuccessState() });
        } catch (error) {
          set(createErrorState(error, ERROR_MESSAGES.UPDATE_AUTO_CARRYOVER));
        }
      },

      updateHabitReminderTime: async (time) => {
        try {
          await dal.setMeta("habit_reminder_time", time);
          set({ habitReminderTime: time, ...createSuccessState() });
        } catch (error) {
          set(createErrorState(error, ERROR_MESSAGES.UPDATE_HABIT_REMINDER));
        }
      },

      updateEveningNudge: async (enabled) => {
        try {
          await dal.setMeta("evening_nudge_enabled", enabled.toString());
          set({ eveningNudgeEnabled: enabled, ...createSuccessState() });
        } catch (error) {
          set(createErrorState(error, ERROR_MESSAGES.UPDATE_EVENING_NUDGE));
        }
      },

      updateTaskReminderTime: async (time) => {
        try {
          await dal.setMeta("task_reminder_time", time);
          set({ taskReminderTime: time, ...createSuccessState() });
        } catch (error) {
          set(createErrorState(error, ERROR_MESSAGES.UPDATE_TASK_REMINDER));
        }
      },

      updateTodayReminder: async (enabled) => {
        try {
          await dal.setMeta("today_reminder_enabled", enabled.toString());
          set({ todayReminderEnabled: enabled, ...createSuccessState() });
        } catch (error) {
          set(createErrorState(error, ERROR_MESSAGES.UPDATE_TODAY_REMINDER));
        }
      },

      updateHaptics: async (enabled) => {
        try {
          await dal.setMeta("haptics_enabled", enabled.toString());
          set({ hapticsEnabled: enabled, ...createSuccessState() });
        } catch (error) {
          set(createErrorState(error, ERROR_MESSAGES.UPDATE_HAPTICS));
        }
      },

      updateSound: async (enabled) => {
        try {
          await dal.setMeta("sound_enabled", enabled.toString());
          set({ soundEnabled: enabled, ...createSuccessState() });
        } catch (error) {
          set(createErrorState(error, ERROR_MESSAGES.UPDATE_SOUND));
        }
      },

      setError: (error) => set({ error }),
    }),
    { name: "settings-store" }
  )
);
