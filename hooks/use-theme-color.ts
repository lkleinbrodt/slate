import { Colors, type ColorName } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorName
) {
  const theme = useColorScheme() === "dark" ? "dark" : "light";
  return props[theme] ?? Colors[theme][colorName];
}
