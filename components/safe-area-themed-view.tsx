import { type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeColor } from "@/hooks/use-theme-color";

export type SafeAreaThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  edges?: ("top" | "right" | "bottom" | "left")[];
};

export function SafeAreaThemedView({
  style,
  lightColor,
  darkColor,
  edges = ["top", "left", "right"],
  ...otherProps
}: SafeAreaThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background"
  );

  return (
    <SafeAreaView
      style={[{ backgroundColor }, style]}
      edges={edges}
      {...otherProps}
    />
  );
}
