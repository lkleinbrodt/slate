/**
 * Date formatting utilities for consistent date handling across the app
 */

/**
 * Format a date for display in the UI
 * @param date - Date object or null
 * @param format - Format type ('short', 'long', 'due')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | null,
  format: "short" | "long" | "due" = "short"
): string {
  if (!date) return "No date selected";

  switch (format) {
    case "short":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    case "long":
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    case "due":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    default:
      return date.toLocaleDateString("en-US");
  }
}

/**
 * Check if a date is valid for task due dates (today or future)
 * @param date - Date object or null
 * @returns true if date is valid (null is valid for optional dates)
 */
export function isDateValid(date: Date | null): boolean {
  if (!date) return true; // No date is valid (optional)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

/**
 * Convert a date to YYYY-MM-DD format for database storage
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 */
export function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Convert YYYY-MM-DD string to Date object
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object
 */
export function fromLocalDateString(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get today's date with time reset to start of day
 * @returns Date object representing today at 00:00:00
 */
export function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}
