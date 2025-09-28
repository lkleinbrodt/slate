import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import { listItemStyles } from "@/lib/utils/styles";
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
  const iconColor = useThemeColor({}, "icon");

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
