/**
 * Application-wide constants to reduce magic numbers and strings
 */

// UI Constants

export const UI = {
  // Touch targets
  MIN_TOUCH_TARGET_SIZE: 44,

  // Spacing (8px base unit system)
  SPACING: {
    XS: 4, // 0.5 * 8
    SM: 8, // 1 * 8
    MD: 16, // 2 * 8
    LG: 24, // 3 * 8
    XL: 32, // 4 * 8
    XXL: 40, // 5 * 8
    XXXL: 48, // 6 * 8
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
