import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import { UI } from "@/lib/constants/app";
import React from "react";
import { SheetManager } from "react-native-actions-sheet";
import { CheckableListItem } from "./CheckableListItem";
import { ThemedText } from "./themed-text";
import { TaskItemProps } from "./types";

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isCompleted,
  onToggle,
  onSkipForToday,
  isReadOnly = false,
}) => {
  const iconColor = useThemeColor({}, "textTertiary");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");

  const handleToggle = () => {
    if (!isReadOnly) {
      onToggle(task.id, task.status === "done"); // Pass current completed status
    }
  };

  const handleEdit = () => {
    if (!isReadOnly) {
      SheetManager.show("add-edit-modal", {
        payload: {
          mode: "edit",
          type: "task",
          itemId: task.id,
        },
      });
    }
  };

  const handleSkipForToday = () => {
    if (onSkipForToday) {
      onSkipForToday(task.id);
    }
  };

  return (
    <CheckableListItem
      isCompleted={task.status === "done"}
      onToggle={handleToggle}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <ThemedText
            type="body"
            style={[
              styles.title,
              { color: textColor },
              isCompleted && styles.completedText,
            ]}
          >
            {task.title}
          </ThemedText>
          {task.dueDate && (
            <ThemedText
              type="caption"
              style={[styles.dueDate, { color: textSecondaryColor }]}
            >
              Due: {task.dueDate}
            </ThemedText>
          )}
        </View>

        {!isReadOnly && !isCompleted && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleSkipForToday}
            >
              <MaterialCommunityIcons
                name="sleep"
                size={20}
                color={iconColor}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={handleEdit}>
              <MaterialIcons name="more-horiz" size={20} color={iconColor} />
            </TouchableOpacity>
          </View>
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
  textContainer: {
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
  dueDate: {
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: UI.SPACING.XS,
  },
  iconButton: {
    width: UI.MIN_TOUCH_TARGET_SIZE,
    height: UI.MIN_TOUCH_TARGET_SIZE,
    borderRadius: UI.MIN_TOUCH_TARGET_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
