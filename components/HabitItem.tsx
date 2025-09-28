import { badgeStyles, listItemStyles } from "@/lib/utils/styles";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { SheetManager } from "react-native-actions-sheet";
import { CheckableListItem } from "./CheckableListItem";
import { ThemedText } from "./themed-text";
import { HabitItemProps } from "./types";
//import materialcommunityicons
import { useThemeColor } from "@/hooks/use-theme-color";

export const HabitItem: React.FC<HabitItemProps> = ({
  habit,
  isCompleted,
  streak,
  onToggle,
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
            style={[
              listItemStyles.text,
              isCompleted && listItemStyles.completedText,
            ]}
          >
            {habit.title}
          </ThemedText>
          {
            <View style={badgeStyles.streak}>
              <ThemedText style={badgeStyles.streakText}>
                🔥 {streak}
              </ThemedText>
            </View>
          }
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
