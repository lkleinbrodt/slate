import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import { useAppStore } from "@/lib/stores/appStore";
import { listItemStyles } from "@/lib/utils/styles";
import React from "react";
import { SheetManager } from "react-native-actions-sheet";
import { ThemedText } from "./themed-text";
import { SlateItemProps } from "./types";

export const SlateItem: React.FC<SlateItemProps> = ({ task, onAddToToday }) => {
  const iconColor = useThemeColor({}, "text");
  const secondaryIconColor = useThemeColor({}, "icon");
  const { skipTaskForToday, todayDate } = useAppStore();

  // Check if task is scheduled for today
  const isScheduledForToday = task.scheduledFor === todayDate;

  return (
    <View style={styles.container}>
      {/* Action Button - changes based on scheduled date */}
      {isScheduledForToday ? (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => skipTaskForToday(task.id)}
        >
          <MaterialCommunityIcons name="sleep" size={24} color={iconColor} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onAddToToday("task", task.id)}
        >
          <MaterialCommunityIcons
            name="arrow-up-right"
            size={24}
            color={iconColor}
          />
        </TouchableOpacity>
      )}

      {/* Task Content */}
      <View style={styles.content}>
        <ThemedText
          style={[
            listItemStyles.text,
            task.status === "done" && listItemStyles.completedText,
          ]}
        >
          {task.title}
        </ThemedText>
        {/* not showing any info for now */}
        {/* {task.notes && (
          <ThemedText style={[styles.itemNotes, { opacity: 0.7 }]}>
            {task.notes}
          </ThemedText>
        )}
        {task.scheduledFor && (
          <ThemedText style={listItemStyles.secondaryText}>
            Scheduled: {task.scheduledFor}
          </ThemedText>
        )}
        {task.dueDate && (
          <ThemedText style={listItemStyles.secondaryText}>
            Due: {task.dueDate}
          </ThemedText>
        )} */}
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
        <MaterialIcons name="more-horiz" size={20} color={secondaryIconColor} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  content: {
    flex: 1,
    marginHorizontal: 8,
  },
  itemNotes: {
    fontSize: 14,
    marginBottom: 2,
    // Color is handled by ThemedText component
  },
});
