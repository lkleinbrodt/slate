import * as Notifications from "expo-notifications";
import * as repo from "@/lib/logic/repo";
import { useSettingsStore } from "@/lib/stores/settings";
import { useTimeStore } from "@/lib/stores/timeStore";
import dayjs from "dayjs";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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
 * Get count of incomplete habits for today
 */
async function getIncompleteHabitsCount(): Promise<number> {
  const today = useTimeStore.getState().getCurrentDate();
  const [activeHabits, completions] = await Promise.all([
    repo.listActiveHabits(),
    repo.getHabitCompletionsForDate(today),
  ]);

  const completedHabitIds = new Set(completions.map((c) => c.habitId));
  return activeHabits.filter((h) => !completedHabitIds.has(h.id)).length;
}

/**
 * Get count of incomplete tasks for today
 */
async function getIncompleteTasksCount(): Promise<number> {
  const today = useTimeStore.getState().getCurrentDate();
  const todayTasks = await repo.listTodayTasks(today);
  return todayTasks.filter((t) => t.status !== "done").length;
}

/**
 * Get count of unscheduled tasks in Slate
 */
async function getSlateTasksCount(): Promise<number> {
  const slateTasks = await repo.listUnscheduledTasks();
  return slateTasks.length;
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
    hour,
    minute,
    repeats: true,
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
 * Schedule periodic habit reminders throughout the day
 * Only schedules if there are incomplete habits
 */
export async function scheduleHabitReminders(
  intervalHours: number
): Promise<void> {
  // Cancel all existing habit reminder notifications
  await cancelNotificationsByPrefix(NOTIFICATION_IDS.HABIT_REMINDER_PREFIX);

  // Check if there are incomplete habits
  const incompleteCount = await getIncompleteHabitsCount();
  if (incompleteCount === 0) {
    return; // No incomplete habits, don't schedule reminders
  }

  // Start from 10 AM, then add intervals
  const startHour = 10;
  const startMinute = 0;
  const maxHour = 20; // Don't schedule after 8 PM

  let currentHour = startHour;
  let reminderIndex = 0;

  while (currentHour < maxHour) {
    const trigger: Notifications.DailyTriggerInput = {
      hour: currentHour,
      minute: startMinute,
      repeats: true,
    };

    await Notifications.scheduleNotificationAsync({
      identifier: `${NOTIFICATION_IDS.HABIT_REMINDER_PREFIX}${reminderIndex}`,
      content: {
        title: "Habit Reminder",
        body:
          incompleteCount === 1
            ? "You have 1 incomplete habit remaining"
            : `You have ${incompleteCount} incomplete habits remaining`,
        sound: true,
      },
      trigger,
    });

    currentHour += intervalHours;
    reminderIndex++;
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
    hour,
    minute,
    repeats: true,
  };

  // Get counts for notification content
  const [incompleteTasks, slateTasks] = await Promise.all([
    getIncompleteTasksCount(),
    getSlateTasksCount(),
  ]);

  let body = "Review your day";
  if (incompleteTasks > 0 || slateTasks > 0) {
    const parts: string[] = [];
    if (incompleteTasks > 0) {
      parts.push(`${incompleteTasks} task${incompleteTasks === 1 ? "" : "s"} incomplete`);
    }
    if (slateTasks > 0) {
      parts.push(`${slateTasks} task${slateTasks === 1 ? "" : "s"} in Slate`);
    }
    body += ` - ${parts.join(", ")}`;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDS.NIGHT_REVIEW,
    content: {
      title: "Night Review",
      body,
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
  if (!settings.habitRemindersEnabled) {
    return;
  }

  const incompleteCount = await getIncompleteHabitsCount();
  
  if (incompleteCount === 0) {
    // All habits complete, cancel reminders
    await cancelNotificationsByPrefix(NOTIFICATION_IDS.HABIT_REMINDER_PREFIX);
  } else {
    // Reschedule with updated count
    await scheduleHabitReminders(settings.habitReminderInterval);
  }
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
    await scheduleHabitReminders(settings.habitReminderInterval);
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

