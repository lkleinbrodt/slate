import assert from "assert";
import dayjs from "dayjs";

// The relative path loads the real module (the runner mocks the "@/" one)
import {
  MAX_HABIT_REMINDERS,
  rescheduleAllNotifications,
  updateHabitRemindersIfNeeded,
} from "../lib/services/notifications";
import { completeHabitOn, insertHabit } from "./helpers";
import { resetScheduled, scheduledIds } from "./mocks/expo-notifications";
import { resetDatabase } from "./mocks/db-connection";
import { useSettingsStore } from "@/lib/stores/settings";
import { useTimeStore } from "@/lib/stores/timeStore";

export async function run() {
  await testOverlappingReschedulesUseLatestState();
  await testRemindersFillUpToTheCap();
}

const waitFor = async (condition: () => boolean) => {
  for (let i = 0; i < 500 && !condition(); i++) {
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
};

// Checking off the last two habits in quick succession starts two reschedules.
// The first still thinks a habit is open; it must not re-add today's
// reminders after the second one dropped them.
async function testOverlappingReschedulesUseLatestState() {
  // Reminders are scheduled against the real clock
  const now = dayjs();
  if (now.hour() >= 23) {
    console.log("  skipped: no reminder slots left today");
    return;
  }
  const today = now.format("YYYY-MM-DD");
  const todayPrefix = `habit_reminder_${now.format("YYYYMMDD")}`;
  const todaysReminders = () =>
    scheduledIds().filter((id) => id.startsWith(todayPrefix));

  resetDatabase();
  resetScheduled();
  useTimeStore.setState({ currentDate: today, isInitialized: true });
  useSettingsStore.setState({
    notificationPermissionStatus: "granted",
    habitRemindersEnabled: true,
    habitReminderInterval: 1,
    habitReminderStart: "00:00",
    habitReminderEnd: "23:59",
  });

  const first = await insertHabit();
  const second = await insertHabit();
  await completeHabitOn(first.id, today);

  const stale = updateHabitRemindersIfNeeded();
  await waitFor(() => todaysReminders().length > 0);
  assert.ok(todaysReminders().length > 0, "one habit open: today is reminded");

  await completeHabitOn(second.id, today);
  const latest = updateHabitRemindersIfNeeded();
  await Promise.all([stale, latest]);

  assert.deepStrictEqual(todaysReminders(), [], "all done: no reminders today");
  assert.ok(scheduledIds().length > 0, "later days are still reminded");

  // A full reschedule goes through the same queue
  await rescheduleAllNotifications();
  assert.deepStrictEqual(todaysReminders(), []);
}

// Reminders are refilled only when the app opens, so schedule as far ahead as the iOS
// pending limit allows instead of a fixed week.
async function testRemindersFillUpToTheCap() {
  const now = dayjs();
  resetDatabase();
  resetScheduled();
  useTimeStore.setState({ currentDate: now.format("YYYY-MM-DD"), isInitialized: true });
  useSettingsStore.setState({
    notificationPermissionStatus: "granted",
    habitRemindersEnabled: true,
    habitReminderInterval: 4,
    habitReminderStart: "10:00",
    habitReminderEnd: "20:00",
  });
  await insertHabit();

  await updateHabitRemindersIfNeeded();
  const reminders = scheduledIds().filter((id) => id.startsWith("habit_reminder_"));
  assert.strictEqual(reminders.length, MAX_HABIT_REMINDERS, "3 a day fills the cap");
  // 60 reminders at 3 a day reach ~20 days out, well past the old 7
  const last = reminders.map((id) => id.slice("habit_reminder_".length, -4)).sort().at(-1)!;
  assert.ok(dayjs(last).diff(now.startOf("day"), "day") >= 19, `last reminder on ${last}`);
}
