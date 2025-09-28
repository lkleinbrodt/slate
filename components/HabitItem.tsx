import { StyleSheet, TouchableOpacity, View } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import { UI } from "@/lib/constants/app";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { SheetManager } from "react-native-actions-sheet";
import { CheckableListItem } from "./CheckableListItem";
import { ThemedText } from "./themed-text";
import { HabitItemProps } from "./types";

export const HabitItem: React.FC<HabitItemProps> = ({
  habit,
  isCompleted,
  streak,
  onToggle,
  isReadOnly = false,
}) => {
  const iconColor = useThemeColor({}, "textTertiary");
  const textColor = useThemeColor({}, "text");
  const accentColor = useThemeColor({}, "accent");
  const accentLightColor = useThemeColor({}, "accentLight");

  const handleToggle = () => {
    if (!isReadOnly) {
      onToggle(habit.id);
    }
  };

  const handleEdit = () => {
    if (!isReadOnly) {
      SheetManager.show("add-edit-modal", {
        payload: {
          mode: "edit",
          type: "habit",
          itemId: habit.id,
        },
      });
    }
  };

  return (
    <CheckableListItem isCompleted={isCompleted} onToggle={handleToggle}>
      <View style={styles.content}>
        <View style={styles.habitInfo}>
          <ThemedText
            type="body"
            style={[
              styles.title,
              { color: textColor },
              isCompleted && styles.completedText,
            ]}
          >
            {habit.title}
          </ThemedText>
          {streak > 0 && (
            <View
              style={[
                styles.streakBadge,
                { backgroundColor: accentLightColor },
              ]}
            >
              <ThemedText
                type="captionSemiBold"
                style={[styles.streakText, { color: accentColor }]}
              >
                🔥 {streak}
              </ThemedText>
            </View>
          )}
        </View>

        {!isReadOnly && (
          <TouchableOpacity style={styles.iconButton} onPress={handleEdit}>
            <MaterialIcons name="more-horiz" size={20} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>
    </CheckableListItem>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: UI.SPACING.SM,
  },
  habitInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: UI.SPACING.SM,
  },
  title: {
    fontWeight: "500",
    flex: 1,
  },
  completedText: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  streakBadge: {
    paddingHorizontal: UI.SPACING.SM,
    paddingVertical: UI.SPACING.XS,
    borderRadius: UI.BORDER_RADIUS.SM,
    alignSelf: "flex-start",
  },
  streakText: {
    fontWeight: "600",
  },
  iconButton: {
    width: UI.MIN_TOUCH_TARGET_SIZE,
    height: UI.MIN_TOUCH_TARGET_SIZE,
    borderRadius: UI.MIN_TOUCH_TARGET_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
