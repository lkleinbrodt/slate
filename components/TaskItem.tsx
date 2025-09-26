import { StyleSheet, TouchableOpacity, View } from "react-native";

import { CheckableListItem } from "./CheckableListItem";
import { IconSymbol } from "./ui/icon-symbol";
import React from "react";
import { TaskItemProps } from "./types";
import { ThemedText } from "./themed-text";
import { listItemStyles } from "@/lib/utils/styles";
import { useThemeColor } from "@/hooks/use-theme-color";

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isCompleted,
  onToggle,
  onEdit,
  onSkipForToday,
  isReadOnly = false,
}) => {
  const iconColor = useThemeColor({}, "icon");

  const handleToggle = () => {
    if (!isReadOnly) {
      onToggle(task.id, !isCompleted);
    }
  };

  const handleEdit = () => {
    if (!isReadOnly) {
      onEdit(
        "task",
        task.id,
        task.title,
        task.notes || undefined,
        task.dueDate || undefined
      );
    }
  };

  const handleSkipForToday = () => {
    if (onSkipForToday) {
      onSkipForToday(task.id);
    }
  };

  return (
    <CheckableListItem isCompleted={isCompleted} onToggle={handleToggle}>
      <View style={styles.content}>
        <View style={{ flex: 1 }}>
          <ThemedText
            style={[
              listItemStyles.text,
              isCompleted && listItemStyles.completedText,
            ]}
          >
            {task.title}
          </ThemedText>
          {task.dueDate && (
            <ThemedText style={listItemStyles.secondaryText}>
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
              <IconSymbol name="forward.fill" size={18} color={iconColor} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={handleEdit}>
              <IconSymbol name="pencil" size={18} color={iconColor} />
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
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});
