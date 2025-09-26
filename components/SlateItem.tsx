import { StyleSheet, TouchableOpacity, View } from "react-native";

import { IconSymbol } from "./ui/icon-symbol";
import React from "react";
import { SlateItemProps } from "./types";
import { ThemedText } from "./themed-text";
import { listItemStyles } from "@/lib/utils/styles";
import { useThemeColor } from "@/hooks/use-theme-color";

export const SlateItem: React.FC<SlateItemProps> = ({
  task,
  onEdit,
  onAddToToday,
}) => {
  const iconColor = useThemeColor({}, "text");
  const secondaryIconColor = useThemeColor({}, "icon");

  return (
    <View style={styles.container}>
      {/* Add to Today Button */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => onAddToToday("task", task.id)}
      >
        <IconSymbol name="plus" size={20} color={iconColor} />
      </TouchableOpacity>

      {/* Task Content */}
      <View style={styles.content}>
        <ThemedText
          style={[
            listItemStyles.text,
            task.isDone && listItemStyles.completedText,
          ]}
        >
          {task.title}
        </ThemedText>
        {task.notes && (
          <ThemedText style={[styles.itemNotes, { opacity: 0.7 }]}>
            {task.notes}
          </ThemedText>
        )}
        {task.dueDate && (
          <ThemedText style={listItemStyles.secondaryText}>
            Due: {task.dueDate}
          </ThemedText>
        )}
      </View>

      {/* Edit Button */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() =>
          onEdit(
            "task",
            task.id,
            task.title,
            task.notes || undefined,
            task.dueDate || undefined
          )
        }
      >
        <IconSymbol name="ellipsis" size={20} color={secondaryIconColor} />
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
