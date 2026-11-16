import { Icon } from "@/components/ui/Icon";
import { PressableScale } from "@/components/ui/PressableScale";
import { Radius } from "@/constants/theme";
import React from "react";
import { StyleSheet } from "react-native";
import { ThemedText } from "./themed-text";
import { toHHmm } from "@/lib/logic/schedule";
import { useTheme } from "@/hooks/use-theme";

/** "07:30" -> "7:30 AM" */
export function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "3:10 – 4:40 PM" */
export function formatRange(start: number, end: number) {
  const a = formatTime(toHHmm(start));
  const b = formatTime(toHHmm(Math.min(end, 24 * 60 - 1)));
  // Drop the first AM/PM when both match
  return a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)} – ${b}` : `${a} – ${b}`;
}

interface TimePickerButtonProps {
  time: string;
  onPress: () => void;
  disabled?: boolean;
  /** Drop the clock icon where space is tight */
  compact?: boolean;
}

export const TimePickerButton: React.FC<TimePickerButtonProps> = ({
  time,
  onPress,
  disabled = false,
  compact = false,
}) => {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      haptics="selection"
      style={[
        styles.button,
        { backgroundColor: colors.surfaceSunken, opacity: disabled ? 0.5 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Time, ${formatTime(time)}`}
    >
      {!compact && <Icon name="clock" size={15} color="textSecondary" weight="bold" />}
      <ThemedText type="calloutMedium" style={styles.text}>
        {formatTime(time)}
      </ThemedText>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 36,
    borderRadius: Radius.pill,
    gap: 6,
  },
  text: { fontVariant: ["tabular-nums"] },
});
