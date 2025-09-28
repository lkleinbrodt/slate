import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import { UI } from "@/lib/constants/app";
import { useAppStore } from "@/lib/stores/appStore";
import React from "react";
import { SheetManager } from "react-native-actions-sheet";
import { ThemedText } from "./themed-text";
import { SlateItemProps } from "./types";

export const SlateItem: React.FC<SlateItemProps> = ({ task, onAddToToday }) => {
  const primaryColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const textTertiaryColor = useThemeColor({}, "textTertiary");
  const borderColor = useThemeColor({}, "border");
  const { skipTaskForToday, todayDate } = useAppStore();

  // Check if task is scheduled for today
  const isScheduledForToday = task.scheduledFor === todayDate;

  return (
    <View style={[styles.container, { borderBottomColor: borderColor }]}>
      {/* Action Button - changes based on scheduled date */}
      {isScheduledForToday ? (
        <TouchableOpacity
          style={[styles.actionButton]}
          onPress={() => skipTaskForToday(task.id)}
        >
          <MaterialCommunityIcons
            name="sleep"
            size={20}
            color={textTertiaryColor}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.actionButton]}
          onPress={() => onAddToToday("task", task.id)}
        >
          <MaterialCommunityIcons
            name="arrow-up-right"
            size={20}
            color={primaryColor}
          />
        </TouchableOpacity>
      )}

      {/* Task Content */}
      <View style={styles.content}>
        <ThemedText
          type="body"
          style={[
            styles.title,
            { color: textColor },
            task.status === "done" && styles.completedText,
          ]}
        >
          {task.title}
        </ThemedText>
      </View>

      {/* Edit Button */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => {
          SheetManager.show("add-edit-modal", {
            payload: {
              mode: "edit",
              type: "task",
              itemId: task.id,
            },
          });
        }}
      >
        <MaterialIcons name="more-horiz" size={20} color={textTertiaryColor} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: UI.SPACING.MD,
    paddingHorizontal: UI.SPACING.SM,
    borderBottomWidth: 1,
    minHeight: UI.MIN_TOUCH_TARGET_SIZE,
    gap: UI.SPACING.SM,
  },
  actionButton: {
    width: UI.MIN_TOUCH_TARGET_SIZE,
    height: UI.MIN_TOUCH_TARGET_SIZE,
    borderRadius: UI.MIN_TOUCH_TARGET_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: "500",
    marginBottom: UI.SPACING.XS,
  },
  completedText: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  metaInfo: {
    flexDirection: "row",
    gap: UI.SPACING.SM,
  },
  metaText: {
    opacity: 0.8,
  },
  iconButton: {
    width: UI.MIN_TOUCH_TARGET_SIZE,
    height: UI.MIN_TOUCH_TARGET_SIZE,
    borderRadius: UI.MIN_TOUCH_TARGET_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
