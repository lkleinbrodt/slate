export const calls = { updateHabitReminders: 0 };

export const updateHabitRemindersIfNeeded = async () => {
  calls.updateHabitReminders++;
};
export const rescheduleAllNotifications = async () => {};
