/**
 * Application-wide constants to reduce magic numbers and strings
 */

// UI Constants

export const UI = {
  // Touch targets
  MIN_TOUCH_TARGET_SIZE: 44,

  // Spacing
  SPACING: {
    XS: 6,
    SM: 10,
    MD: 16,
    LG: 20,
    XL: 24,
    XXL: 28,
    XXXL: 36,
  },

  // Border radius
  BORDER_RADIUS: {
    SM: 6,
    MD: 8,
    LG: 12,
    XL: 16,
    XXL: 20,
  },

  // Font sizes
  FONT_SIZE: {
    XS: 12,
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 20,
    XXL: 22,
    XXXL: 26,
  },

  // Animation durations (ms)
  ANIMATION: {
    FAST: 150,
    NORMAL: 200,
    SLOW: 300,
    VERY_SLOW: 500,
  },

  // Modal dimensions
  MODAL: {
    MAX_WIDTH: 500,
    WIDTH_PERCENTAGE: "90%",
    MAX_HEIGHT_PERCENTAGE: "90%",
  },
} as const;

// Color Constants
export const COLORS = {
  // Primary brand colors
  PRIMARY: "#10B981",
  PRIMARY_DARK: "#059669",
  PRIMARY_LIGHT: "#D1FAE5",

  // Status colors
  SUCCESS: "#10B981",
  WARNING: "#F59E0B",
  ERROR: "#EF4444",
  INFO: "#3B82F6",

  // Neutral colors
  GRAY: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },

  // Background colors
  BACKGROUND: {
    PRIMARY: "#FFFFFF",
    SECONDARY: "#F9FAFB",
    MODAL_OVERLAY: "rgba(0, 0, 0, 0.5)",
  },

  // Text colors
  TEXT: {
    PRIMARY: "#111827",
    SECONDARY: "#6B7280",
    TERTIARY: "#9CA3AF",
    INVERSE: "#FFFFFF",
  },
} as const;

// App-specific Constants
export const APP = {
  // Default settings
  DEFAULT_DAY_START: "04:00",
  DEFAULT_HABIT_REMINDER_TIME: "08:00",
  DEFAULT_TASK_REMINDER_TIME: "09:00",
  DEFAULT_EVENING_NUDGE_TIME: "19:00",

  // Feature flags
  DEFAULT_AUTO_CARRYOVER: true,
  DEFAULT_HAPTICS_ENABLED: true,
  DEFAULT_SOUND_ENABLED: false,
  DEFAULT_EVENING_NUDGE_ENABLED: false,
  DEFAULT_TODAY_REMINDER_ENABLED: false,

  // Limits
  MAX_TITLE_LENGTH: 100,
  MAX_NOTES_LENGTH: 500,
  MAX_STREAK_DISPLAY: 999,

  // Database
  SCHEMA_VERSION: 1,

  // Notifications
  NOTIFICATION_IDS: {
    HABIT_DAILY: "habit_daily",
    TASK_DUE_PREFIX: "task_due",
  },
} as const;

// Component-specific Constants
export const COMPONENTS = {
  // Progress tracker
  PROGRESS: {
    HEIGHT: 8,
    BORDER_RADIUS: 4,
  },

  // Streak badge
  STREAK_BADGE: {
    BACKGROUND: "#FEF3C7",
    TEXT_COLOR: "#D97706",
    PADDING_HORIZONTAL: 8,
    PADDING_VERTICAL: 4,
    BORDER_RADIUS: 12,
  },

  // Calendar
  CALENDAR: {
    THEME: {
      backgroundColor: "white",
      calendarBackground: "white",
      textSectionTitleColor: "#6B7280",
      selectedDayBackgroundColor: "#10B981",
      selectedDayTextColor: "white",
      todayTextColor: "#10B981",
      dayTextColor: "#374151",
      textDisabledColor: "#D1D5DB",
      arrowColor: "#10B981",
      monthTextColor: "#374151",
      indicatorColor: "#10B981",
      textDayFontWeight: "500",
      textMonthFontWeight: "600",
      textDayHeaderFontWeight: "600",
      textDayFontSize: 16,
      textMonthFontSize: 18,
      textDayHeaderFontSize: 14,
    },
  },

  // Button styles
  BUTTON: {
    HEIGHT: 52,
    BORDER_RADIUS: 8,
    PADDING_HORIZONTAL: 20,
    PADDING_VERTICAL: 14,
  },

  // Input styles
  INPUT: {
    HEIGHT: 52,
    BORDER_RADIUS: 8,
    PADDING_HORIZONTAL: 16,
    PADDING_VERTICAL: 12,
    BORDER_WIDTH: 1,
  },
} as const;

// Text Constants
export const TEXT = {
  // Placeholders
  PLACEHOLDERS: {
    TASK_TITLE: "Task",
    HABIT_TITLE: "Habit",
    NOTES: "Notes (optional)",
    DUE_DATE: "Due date",
    NO_DATE_SELECTED: "No date selected",
  },

  // Labels
  LABELS: {
    TASKS: "Tasks",
    HABITS: "Habits",
    TODAY: "Today",
    SLATE: "Slate",
    DUE_DATE: "Due date",
    SELECTED: "Selected:",
  },

  // Messages
  MESSAGES: {
    LOADING: "Loading your slate...",
    NO_TASKS_TODAY: "No tasks planned for today yet.",
    NO_HABITS: "No habits yet",
    ALL_CAUGHT_UP: "You're all caught up!",
    WELCOME: "Welcome to Slate!",
    WELCOME_SUBTITLE: "Add your first task or habit to get started.",
    SELECT_FUTURE_DATE: "Please select a future date",
  },

  // Actions
  ACTIONS: {
    ADD: "Add",
    SAVE: "Save",
    CANCEL: "Cancel",
    CLEAR: "Clear",
    CONFIRM: "Confirm",
    EDIT: "Edit",
  },

  // Types
  TYPES: {
    TASK: "Task",
    HABIT: "Habit",
    TASK_EMOJI: "📝",
    HABIT_EMOJI: "🔄",
    CALENDAR_EMOJI: "📅",
    FIRE_EMOJI: "🔥",
    SETTINGS_EMOJI: "⋯",
  },
} as const;

// Date/Time Constants
export const DATE_TIME = {
  // Date formats
  FORMATS: {
    DISPLAY_SHORT: "MMM D, YYYY",
    DISPLAY_LONG: "dddd, MMMM D, YYYY",
    DISPLAY_DUE: "MMM D",
    STORAGE: "YYYY-MM-DD",
    TIME_24H: "HH:mm",
  },

  // Time constants
  HOURS_IN_DAY: 24,
  MINUTES_IN_HOUR: 60,
  SECONDS_IN_MINUTE: 60,
  MILLISECONDS_IN_SECOND: 1000,

  // Day boundaries
  MIDNIGHT: "00:00",
  DEFAULT_DAY_START: "04:00",
} as const;
