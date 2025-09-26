import { StyleSheet, TouchableOpacity, View } from "react-native";
import { badgeStyles, listItemStyles } from "@/lib/utils/styles";

import { CheckableListItem } from "./CheckableListItem";
import { HabitItemProps } from "./types";
import { IconSymbol } from "./ui/icon-symbol";
import React from "react";
import { ThemedText } from "./themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

export const HabitItem: React.FC<HabitItemProps> = ({
  habit,
  isCompleted,
  streak,
  onToggle,
  onEdit,
  isReadOnly = false,
}) => {
  const iconColor = useThemeColor({}, "icon");

  const handleToggle = () => {
    if (!isReadOnly) {
      onToggle(habit.id);
    }
  };

  const handleEdit = () => {
    if (!isReadOnly) {
      onEdit("habit", habit.id, habit.title, habit.notes || undefined);
    }
  };

  return (
    <CheckableListItem isCompleted={isCompleted} onToggle={handleToggle}>
      <View style={styles.content}>
        <View style={styles.habitInfo}>
          <ThemedText
            style={[
              listItemStyles.text,
              isCompleted && listItemStyles.completedText,
            ]}
          >
            {habit.title}
          </ThemedText>
          {streak > 0 && (
            <View style={badgeStyles.streak}>
              <ThemedText style={badgeStyles.streakText}>
                🔥 {streak}
              </ThemedText>
            </View>
          )}
        </View>

        {!isReadOnly && (
          <TouchableOpacity style={styles.iconButton} onPress={handleEdit}>
            <IconSymbol name="pencil" size={18} color={iconColor} />
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
  },
  habitInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});
