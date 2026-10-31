/**
 * Slate's design tokens.
 *
 * The look comes from the app icon: a sandstone tile with a sunrise pressed
 * into it. Light mode is warm sand by day; dark mode is slate at dusk. One bold
 * accent (sunrise) marks actions and tasks, sage marks habits, amber marks
 * streaks.
 */

const palette = {
  light: {
    background: "#F4EEE3",
    backgroundSecondary: "#ECE4D5",
    surface: "#FBF8F2",
    surfaceElevated: "#FFFFFF",
    surfaceSunken: "#E9E0CF",

    text: "#2B2620",
    textSecondary: "#6E655A",
    textTertiary: "#A2988A",
    textInverse: "#FFFDF8",

    border: "#E3D9C8",
    borderStrong: "#D2C4AD",

    primary: "#D2632F",
    primaryPressed: "#B9531F",
    primarySoft: "#F7DDCB",
    onPrimary: "#FFFDF8",

    habit: "#5F8A66",
    habitSoft: "#DCE6D6",

    streak: "#D9902A",
    streakSoft: "#F5E4C2",

    clay: "#EFCF9C",
    claySoft: "#F6E6CA",

    success: "#5F8A66",
    warning: "#D9902A",
    error: "#C0442C",
    errorSoft: "#F6D9D0",

    shadow: "#5A4127",
    scrim: "rgba(43, 38, 32, 0.45)",
  },
  dark: {
    background: "#181A1E",
    backgroundSecondary: "#1F2226",
    surface: "#22252A",
    surfaceElevated: "#2A2E34",
    surfaceSunken: "#141518",

    text: "#F1ECE3",
    textSecondary: "#B2ABA0",
    textTertiary: "#78736B",
    textInverse: "#1A1B1E",

    border: "#2F3238",
    borderStrong: "#3E424A",

    primary: "#EE7E47",
    primaryPressed: "#D96B35",
    primarySoft: "#3A2A21",
    onPrimary: "#1C1410",

    habit: "#8DB892",
    habitSoft: "#243028",

    streak: "#EDB357",
    streakSoft: "#3A3122",

    clay: "#C9A774",
    claySoft: "#2E2A24",

    success: "#8DB892",
    warning: "#EDB357",
    error: "#EF6A4F",
    errorSoft: "#3B231E",

    shadow: "#000000",
    scrim: "rgba(0, 0, 0, 0.6)",
  },
};

type Palette = typeof palette.light;

// Older names some components still read; they map onto the palette above
const aliases = (p: Palette) => ({
  backgroundTertiary: p.surfaceSunken,
  primaryDark: p.primaryPressed,
  primaryLight: p.primarySoft,
  secondary: p.textSecondary,
  secondaryDark: p.text,
  secondaryLight: p.surfaceSunken,
  accent: p.streak,
  accentDark: p.streak,
  accentLight: p.streakSoft,
  info: p.primary,
  tint: p.primary,
  icon: p.textSecondary,
  tabIconDefault: p.textTertiary,
  tabIconSelected: p.primary,
  borderLight: p.border,
  borderDark: p.borderStrong,
  surfaceOverlay: p.scrim,
});

export const Colors = {
  light: { ...palette.light, ...aliases(palette.light) },
  dark: { ...palette.dark, ...aliases(palette.dark) },
};

export type ThemeColors = typeof Colors.light;
export type ColorName = keyof ThemeColors;

/** Font family names, as registered in app/_layout.tsx */
export const FontFamily = {
  serif: "Fraunces_600SemiBold",
  serifBold: "Fraunces_700Bold",
  serifItalic: "Fraunces_400Regular_Italic",
  sans: "DMSans_400Regular",
  sansMedium: "DMSans_500Medium",
  sansSemiBold: "DMSans_600SemiBold",
  sansBold: "DMSans_700Bold",
} as const;

export const Type = {
  display: { fontFamily: FontFamily.serif, fontSize: 36, lineHeight: 42, letterSpacing: -0.8 },
  title: { fontFamily: FontFamily.serif, fontSize: 26, lineHeight: 32, letterSpacing: -0.4 },
  heading: { fontFamily: FontFamily.serif, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  greeting: { fontFamily: FontFamily.serifItalic, fontSize: 17, lineHeight: 22 },
  numeral: { fontFamily: FontFamily.serifBold, fontSize: 30, lineHeight: 34, letterSpacing: -0.5 },
  body: { fontFamily: FontFamily.sans, fontSize: 16, lineHeight: 22 },
  bodyMedium: { fontFamily: FontFamily.sansMedium, fontSize: 16, lineHeight: 22 },
  bodySemiBold: { fontFamily: FontFamily.sansSemiBold, fontSize: 16, lineHeight: 22 },
  callout: { fontFamily: FontFamily.sans, fontSize: 14, lineHeight: 19 },
  calloutMedium: { fontFamily: FontFamily.sansMedium, fontSize: 14, lineHeight: 19 },
  caption: { fontFamily: FontFamily.sans, fontSize: 13, lineHeight: 17 },
  captionMedium: { fontFamily: FontFamily.sansMedium, fontSize: 13, lineHeight: 17 },
  eyebrow: {
    fontFamily: FontFamily.sansBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
  },
  button: { fontFamily: FontFamily.sansSemiBold, fontSize: 16, lineHeight: 20 },
} as const;

export type TypeName = keyof typeof Type;

export const Space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

/** Soft, warm drop shadow. Dark mode leans on borders instead. */
export const shadow = (scheme: "light" | "dark", level: 1 | 2 | 3 = 1) => {
  const c = Colors[scheme];
  const spec = {
    1: { y: 2, r: 8, o: 0.07 },
    2: { y: 6, r: 16, o: 0.1 },
    3: { y: 12, r: 28, o: 0.16 },
  }[level];
  return {
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: spec.y },
    shadowRadius: spec.r,
    shadowOpacity: scheme === "dark" ? spec.o * 2.5 : spec.o,
    elevation: level * 2,
  };
};

export const Motion = {
  spring: { damping: 16, stiffness: 220, mass: 0.9 },
  springSoft: { damping: 20, stiffness: 140 },
  springBouncy: { damping: 13, stiffness: 260 },
  fast: 150,
  normal: 220,
  slow: 360,
} as const;
