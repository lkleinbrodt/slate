/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

// Modern color palette with sophisticated indigo primary and warm slate gray secondary
const primaryColor = "#4F46E5"; // Indigo-600
const primaryColorDark = "#3730A3"; // Indigo-800
const primaryColorLight = "#E0E7FF"; // Indigo-100

const secondaryColor = "#64748B"; // Slate-500
const secondaryColorDark = "#334155"; // Slate-700
const secondaryColorLight = "#F1F5F9"; // Slate-100

const accentColor = "#F59E0B"; // Amber-500
const accentColorDark = "#D97706"; // Amber-600
const accentColorLight = "#FEF3C7"; // Amber-100

const tintColorLight = primaryColor;
const tintColorDark = "#E0E7FF";

export const Colors = {
  light: {
    // Text colors
    text: "#0F172A", // Slate-900
    textSecondary: "#475569", // Slate-600
    textTertiary: "#94A3B8", // Slate-400
    textInverse: "#FFFFFF",

    // Background colors
    background: "#FFFFFF",
    backgroundSecondary: "#F8FAFC", // Slate-50
    backgroundTertiary: "#F1F5F9", // Slate-100

    // Brand colors
    primary: primaryColor,
    primaryDark: primaryColorDark,
    primaryLight: primaryColorLight,
    secondary: secondaryColor,
    secondaryDark: secondaryColorDark,
    secondaryLight: secondaryColorLight,
    accent: accentColor,
    accentDark: accentColorDark,
    accentLight: accentColorLight,

    // Status colors
    success: "#10B981", // Emerald-500
    warning: "#F59E0B", // Amber-500
    error: "#EF4444", // Red-500
    info: "#3B82F6", // Blue-500

    // UI colors
    tint: tintColorLight,
    icon: "#64748B", // Slate-500
    tabIconDefault: "#94A3B8", // Slate-400
    tabIconSelected: tintColorLight,

    // Border colors
    border: "#E2E8F0", // Slate-200
    borderLight: "#F1F5F9", // Slate-100
    borderDark: "#CBD5E1", // Slate-300

    // Surface colors
    surface: "#FFFFFF",
    surfaceElevated: "#F8FAFC", // Slate-50
    surfaceOverlay: "rgba(0, 0, 0, 0.5)",
  },
  dark: {
    // Text colors
    text: "#F8FAFC", // Slate-50
    textSecondary: "#CBD5E1", // Slate-300
    textTertiary: "#94A3B8", // Slate-400
    textInverse: "#0F172A", // Slate-900

    // Background colors
    background: "#0F172A", // Slate-900
    backgroundSecondary: "#1E293B", // Slate-800
    backgroundTertiary: "#334155", // Slate-700

    // Brand colors
    primary: "#6366F1", // Indigo-500
    primaryDark: "#4F46E5", // Indigo-600
    primaryLight: "#312E81", // Indigo-900
    secondary: "#94A3B8", // Slate-400
    secondaryDark: "#64748B", // Slate-500
    secondaryLight: "#CBD5E1", // Slate-300
    accent: "#F59E0B", // Amber-500
    accentDark: "#D97706", // Amber-600
    accentLight: "#92400E", // Amber-800

    // Status colors
    success: "#10B981", // Emerald-500
    warning: "#F59E0B", // Amber-500
    error: "#EF4444", // Red-500
    info: "#3B82F6", // Blue-500

    // UI colors
    tint: tintColorDark,
    icon: "#94A3B8", // Slate-400
    tabIconDefault: "#64748B", // Slate-500
    tabIconSelected: tintColorDark,

    // Border colors
    border: "#334155", // Slate-700
    borderLight: "#475569", // Slate-600
    borderDark: "#1E293B", // Slate-800

    // Surface colors
    surface: "#1E293B", // Slate-800
    surfaceElevated: "#334155", // Slate-700
    surfaceOverlay: "rgba(0, 0, 0, 0.7)",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
