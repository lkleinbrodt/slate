import * as repo from "@/lib/logic/repo";

import { create } from "zustand";

interface SettingsState {
  dayStart: string;
  loading: boolean;
  loadSettings: () => Promise<void>;
  updateDayStart: (time: string) => Promise<void>;
}

const DEFAULT_SETTINGS = {
  dayStart: "04:00",
};

export const useSettingsStore = create<SettingsState>((set) => ({
  ...DEFAULT_SETTINGS,
  loading: true,

  loadSettings: async () => {
    set({ loading: true });
    const dayStart = await repo.getSetting("day_start");
    set({
      dayStart: dayStart || DEFAULT_SETTINGS.dayStart,
      loading: false,
    });
  },

  updateDayStart: async (time: string) => {
    await repo.setSetting("day_start", time);
    set({ dayStart: time });
  },
}));
