import { Colors, type ThemeColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function useTheme(): {
  colors: ThemeColors;
  scheme: "light" | "dark";
  isDark: boolean;
} {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  return { colors: Colors[scheme], scheme, isDark: scheme === "dark" };
}
