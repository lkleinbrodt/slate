/**
 * Shared error handling utilities for consistent error management across stores
 */

/**
 * Extract error message from various error types
 * @param error - Error object or unknown
 * @param fallbackMessage - Fallback message if error is not an Error instance
 * @returns Error message string
 */
export function getErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
}

/**
 * Create a standardized error state object
 * @param error - Error object or unknown
 * @param fallbackMessage - Fallback message if error is not an Error instance
 * @returns Error state object
 */
export function createErrorState(error: unknown, fallbackMessage: string) {
  return {
    error: getErrorMessage(error, fallbackMessage),
    loading: false,
  };
}

/**
 * Create a standardized success state object
 * @returns Success state object
 */
export function createSuccessState() {
  return {
    error: null,
  };
}

/**
 * Create a standardized loading state object
 * @returns Loading state object
 */
export function createLoadingState() {
  return {
    loading: true,
    error: null,
  };
}

/**
 * Common error messages for different operations
 */
export const ERROR_MESSAGES = {
  LOAD_TASKS: "Failed to load tasks",
  ADD_TASK: "Failed to add task",
  UPDATE_TASK: "Failed to update task",
  COMPLETE_TASK: "Failed to complete task",
  PLAN_TASK: "Failed to plan task",
  UNPLAN_TASK: "Failed to unplan task",

  LOAD_HABITS: "Failed to load habits",
  ADD_HABIT: "Failed to add habit",
  UPDATE_HABIT: "Failed to update habit",
  COMPLETE_HABIT: "Failed to complete habit",
  GET_STREAK: "Failed to get habit streak",

  LOAD_DAY_PLAN: "Failed to load day plan",
  ADD_TO_DAY: "Failed to add to day plan",
  REMOVE_FROM_DAY: "Failed to remove from day plan",
  UPDATE_PERFECT_DAY: "Failed to update perfect day",

  LOAD_SETTINGS: "Failed to load settings",
  UPDATE_DAY_START: "Failed to update day start",
  UPDATE_AUTO_CARRYOVER: "Failed to update auto carryover",
  UPDATE_HABIT_REMINDER: "Failed to update habit reminder time",
  UPDATE_EVENING_NUDGE: "Failed to update evening nudge",
  UPDATE_TASK_REMINDER: "Failed to update task reminder time",
  UPDATE_TODAY_REMINDER: "Failed to update today reminder",
  UPDATE_HAPTICS: "Failed to update haptics",
  UPDATE_SOUND: "Failed to update sound",
} as const;
