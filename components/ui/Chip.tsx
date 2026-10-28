import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Icon, type IconName } from "./Icon";

import { PressableScale } from "./PressableScale";
import { Radius } from "@/constants/theme";
import React from "react";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

export type ChipTone = "neutral" | "primary" | "habit" | "streak" | "error";

interface ChipProps {
  label: string;
  icon?: IconName;
  tone?: ChipTone;
  /** Filled chips are for chosen values; outlined ones are prompts to choose */
  filled?: boolean;
  onPress?: () => void;
  onClear?: () => void;
  size?: "sm" | "md";
  style?: StyleProp<ViewStyle>;
}

export function Chip({
  label,
  icon,
  tone = "neutral",
  filled = true,
  onPress,
  onClear,
  size = "sm",
  style,
}: ChipProps) {
  const { colors } = useTheme();
  const toneColors = {
    neutral: { fg: colors.textSecondary, bg: colors.surfaceSunken },
    primary: { fg: colors.primary, bg: colors.primarySoft },
    habit: { fg: colors.habit, bg: colors.habitSoft },
    streak: { fg: colors.streak, bg: colors.streakSoft },
    error: { fg: colors.error, bg: colors.errorSoft },
  }[tone];
  const md = size === "md";

  const content = (
    <View
      style={[
        styles.chip,
        md ? styles.md : styles.sm,
        filled
          ? { backgroundColor: toneColors.bg, borderColor: "transparent" }
          : { backgroundColor: "transparent", borderColor: colors.borderStrong, borderStyle: "dashed" },
        style,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={md ? 16 : 13}
          color={filled ? toneColors.fg : colors.textSecondary}
          weight={filled ? "bold" : "regular"}
        />
      )}
      <ThemedText
        type={md ? "calloutMedium" : "captionMedium"}
        style={{ color: filled ? toneColors.fg : colors.textSecondary }}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
      {onClear && (
        <PressableScale onPress={onClear} hitSlop={10} haptics="selection" accessibilityLabel={`Clear ${label}`}>
          <Icon name="x" size={md ? 14 : 12} color={toneColors.fg} weight="bold" />
        </PressableScale>
      )}
    </View>
  );

  if (!onPress) return content;
  return (
    <PressableScale onPress={onPress} haptics="selection" accessibilityRole="button">
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  sm: { gap: 4, paddingHorizontal: 8, paddingVertical: 3 },
  md: { gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
});
