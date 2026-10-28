import * as Notifications from "expo-notifications";
import * as repo from "@/lib/logic/repo";
import { useSettingsStore } from "@/lib/stores/settings";
import { useTimeStore } from "@/lib/stores/timeStore";
import dayjs from "dayjs";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Notification ID prefixes
const NOTIFICATION_IDS = {
  PLAN_DAY: "plan_day_daily",
  HABIT_REMINDER_PREFIX: "habit_reminder_",
  NIGHT_REVIEW: "night_review_daily",
} as const;

// Habit reminders are one-shot notifications scheduled this many days ahead
// (re-filled whenever the app opens). iOS keeps at most 64 pending, and 2 are
// the daily plan/review ones, so cap the total.
const HABIT_REMINDER_DAYS_AHEAD = 7;
const MAX_HABIT_REMINDERS = 60;

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  const granted = finalStatus === "granted";
  useSettingsStore
    .getState()
    .setNotificationPermissionStatus(
      granted ? "granted" : finalStatus === "denied" ? "denied" : "undetermined"
    );

  return granted;
}

/**
 * Get current notification permission status
 */
export async function getNotificationPermissionStatus(): Promise<
  "undetermined" | "granted" | "denied"
> {
  const { status } = await Notifications.getPermissionsAsync();
  const statusMap: Record<
    Notifications.PermissionStatus,
    "undetermined" | "granted" | "denied"
  > = {
    [Notifications.PermissionStatus.UNDETERMINED]: "undetermined",
    [Notifications.PermissionStatus.GRANTED]: "granted",
    [Notifications.PermissionStatus.DENIED]: "denied",
  };
  return statusMap[status];
}

/**
 * Cancel all notifications with a specific prefix
 */
async function cancelNotificationsByPrefix(prefix: string): Promise<void> {
  const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = allNotifications.filter((n) => n.identifier.startsWith(prefix));
  await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

/**
 * Cancel all app notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get active habit count and how many are still incomplete today
 */
async function getHabitCounts(): Promise<{ active: number; incomplete: number }> {
  const today = useTimeStore.getState().getCurrentDate();
  const [activeHabits, completions] = await Promise.all([
    repo.listActiveHabits(),
    repo.getHabitCompletionsForDate(today),
  ]);

  const completedHabitIds = new Set(completions.map((c) => c.habitId));
  return {
    active: activeHabits.length,
    incomplete: activeHabits.filter((h) => !completedHabitIds.has(h.id)).length,
  };
}

/**
 * Schedule the "Plan your day" morning notification
 */
export async function schedulePlanYourDayNotification(
  time: string
): Promise<void> {
  // Cancel existing notification
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.PLAN_DAY);

  const [hour, minute] = time.split(":").map(Number);
  const trigger: Notifications.DailyTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
  };

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDS.PLAN_DAY,
    content: {
      title: "Time to plan your day!",
      body: "Move tasks from Slate to Today",
      sound: true,
    },
    trigger,
  });
}

/**
 * Schedule habit reminders every `intervalHours` from the configured start
 * time until the end time (inclusive).
 *
 * Uses one-shot date triggers for the next week rather than repeating ones,
 * so today's remaining reminders can be dropped once all habits are done
 * without losing tomorrow's.
 */
export async function scheduleHabitReminders(
  intervalHours: number,
  start: string,
  end: string
): Promise<void> {
  await cancelNotificationsByPrefix(NOTIFICATION_IDS.HABIT_REMINDER_PREFIX);

  const { active, incomplete } = await getHabitCounts();
  if (active === 0) return;

  const now = dayjs();
  const appToday = useTimeStore.getState().getCurrentDate();
  const stepMinutes = Math.max(1, intervalHours) * 60;
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);
  let scheduled = 0;

  for (let dayOffset = 0; dayOffset < HABIT_REMINDER_DAYS_AHEAD; dayOffset++) {
    const day = now.add(dayOffset, "day").startOf("day");
    const isAppToday = day.format("YYYY-MM-DD") === appToday;
    if (isAppToday && incomplete === 0) continue;

    for (
      let minutes = startMinutes;
      minutes <= endMinutes && scheduled < MAX_HABIT_REMINDERS;
      minutes += stepMinutes
    ) {
      // Set wall-clock time directly (adding minutes to midnight drifts on DST days)
      const fireAt = day.hour(Math.floor(minutes / 60)).minute(minutes % 60);
      if (!fireAt.isAfter(now)) continue;
      scheduled++;

      await Notifications.scheduleNotificationAsync({
        identifier: `${NOTIFICATION_IDS.HABIT_REMINDER_PREFIX}${fireAt.format("YYYYMMDDHHmm")}`,
        content: {
          title: "Habit Reminder",
          body: isAppToday
            ? incomplete === 1
              ? "You have 1 incomplete habit remaining"
              : `You have ${incomplete} incomplete habits remaining`
            : "Don't forget your habits today",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt.toDate(),
        },
      });
    }
  }
}

/**
 * Schedule the night review notification
 */
export async function scheduleNightReviewNotification(
  time: string
): Promise<void> {
  // Cancel existing notification
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.NIGHT_REVIEW);

  const [hour, minute] = time.split(":").map(Number);
  const trigger: Notifications.DailyTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
  };

  // Body is static: a repeating notification's content is fixed when it's
  // scheduled, so live counts would go stale after the first day.
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDS.NIGHT_REVIEW,
    content: {
      title: "Night Review",
      body: "Wrap up today and tidy your Slate for tomorrow",
      sound: true,
    },
    trigger,
  });
}

/**
 * Update habit reminders based on current completion status
 * Call this after habit completion/undo operations
 */
export async function updateHabitRemindersIfNeeded(): Promise<void> {
  const settings = useSettingsStore.getState();
  if (
    !settings.habitRemindersEnabled ||
    settings.notificationPermissionStatus !== "granted"
  ) {
    return;
  }

  // Reschedules with the updated count (drops today's if all are done)
  await scheduleHabitReminders(
    settings.habitReminderInterval,
    settings.habitReminderStart,
    settings.habitReminderEnd
  );
}

/**
 * Reschedule all notifications based on current settings
 */
export async function rescheduleAllNotifications(): Promise<void> {
  const settings = useSettingsStore.getState();

  // Check permissions first
  const permissionStatus = await getNotificationPermissionStatus();
  useSettingsStore.getState().setNotificationPermissionStatus(permissionStatus);

  if (permissionStatus !== "granted") {
    return; // Can't schedule without permission
  }

  // Schedule plan your day notification
  if (settings.planYourDayEnabled) {
    await schedulePlanYourDayNotification(settings.planYourDayTime);
  } else {
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.PLAN_DAY);
  }

  // Schedule habit reminders
  if (settings.habitRemindersEnabled) {
    await scheduleHabitReminders(
      settings.habitReminderInterval,
      settings.habitReminderStart,
      settings.habitReminderEnd
    );
  } else {
    await cancelNotificationsByPrefix(NOTIFICATION_IDS.HABIT_REMINDER_PREFIX);
  }

  // Schedule night review notification
  if (settings.nightReviewEnabled) {
    await scheduleNightReviewNotification(settings.nightReviewTime);
  } else {
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.NIGHT_REVIEW);
  }
}
