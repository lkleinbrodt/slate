import { StyleSheet, TouchableOpacity } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import { UI } from "@/lib/constants/app";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ThemedText } from "./themed-text";

interface TimePickerButtonProps {
  time: string;
  onTimeChange?: (time: string) => void;
  onPress?: () => void;
  disabled?: boolean;
}

export const TimePickerButton: React.FC<TimePickerButtonProps> = ({
  time,
  onTimeChange,
  onPress,
  disabled = false,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (onTimeChange) {
      // Default behavior: open time picker if onTimeChange is provided
      onTimeChange(time);
    }
  };
  const backgroundColor = useThemeColor({}, "backgroundSecondary");
  const borderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor, borderColor },
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      <Ionicons
        name="time-outline"
        size={16}
        color={disabled ? textSecondaryColor : textColor}
      />
      <ThemedText
        type="body"
        style={[
          styles.text,
          { color: disabled ? textSecondaryColor : textColor },
        ]}
      >
        {time}
      </ThemedText>
      <Ionicons
        name="chevron-down"
        size={16}
        color={disabled ? textSecondaryColor : textColor}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: UI.SPACING.MD,
    paddingVertical: UI.SPACING.SM,
    borderRadius: UI.BORDER_RADIUS.MD,
    borderWidth: 1,
    gap: UI.SPACING.SM,
    minHeight: UI.MIN_TOUCH_TARGET_SIZE,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "500",
  },
});
