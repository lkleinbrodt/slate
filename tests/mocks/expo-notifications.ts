// In-memory stand-in for expo-notifications. Every call yields to the event
// loop, like the native bridge does, so overlapping reschedules can interleave.
type Request = { identifier: string; content: unknown; trigger: unknown };

const scheduled = new Map<string, Request>();
const tick = () => new Promise((resolve) => setTimeout(resolve, 1));

export const SchedulableTriggerInputTypes = { DAILY: "daily", DATE: "date" };
export const PermissionStatus = {
  UNDETERMINED: "undetermined",
  GRANTED: "granted",
  DENIED: "denied",
};

export const setNotificationHandler = () => {};
export const getPermissionsAsync = async () => ({ status: "granted" });
export const requestPermissionsAsync = async () => ({ status: "granted" });

export async function getAllScheduledNotificationsAsync() {
  await tick();
  return [...scheduled.values()];
}
export async function cancelScheduledNotificationAsync(id: string) {
  await tick();
  scheduled.delete(id);
}
export async function scheduleNotificationAsync(request: Request) {
  await tick();
  scheduled.set(request.identifier, request);
  return request.identifier;
}

export const scheduledIds = () => [...scheduled.keys()];
export const resetScheduled = () => scheduled.clear();
