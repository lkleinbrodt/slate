import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { useThemeColor } from "@/hooks/use-theme-color";
import { UI } from "@/lib/constants/app";
import { SheetManager } from "react-native-actions-sheet";
import { SatisfyingCheckbox } from "./SatisfyingCheckbox";
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
  const isDone = task.status === "done";
  const strikeWidth = useSharedValue(isDone ? 100 : 0);

  useEffect(() => {
    // Animate strikethrough: 0% to 100% width
    strikeWidth.value = withTiming(isDone ? 100 : 0, { duration: 250 });
  }, [isDone]);

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

  const rStrikeLine = useAnimatedStyle(() => ({
    width: `${strikeWidth.value}%`,
  }));

  const rTextOpacity = useAnimatedStyle(() => ({
    opacity: withTiming(isDone ? 0.5 : 1, { duration: 300 }),
  }));

  return (
    <View style={styles.container}>
      {/* Checkbox */}
      {!isReadOnly && (
        <SatisfyingCheckbox checked={isDone} onPress={handleToggle} />
      )}

      {/* Text Container */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleToggle}
        style={styles.textWrapper}
        disabled={isReadOnly}
      >
        <Animated.View style={rTextOpacity}>
          <ThemedText type="body" style={[styles.text, { color: textColor }]}>
            {task.title}
          </ThemedText>

          {/* The Strikethrough Line */}
          <Animated.View style={[styles.strikeLine, rStrikeLine]} />
        </Animated.View>

        {task.dueDate && (
          <ThemedText
            type="caption"
            style={[styles.subtext, { color: textSecondaryColor }]}
          >
            Due: {task.dueDate}
          </ThemedText>
        )}
      </TouchableOpacity>

      {!isReadOnly && !isDone && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleSkipForToday}
          >
            <MaterialCommunityIcons name="sleep" size={20} color={iconColor} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={handleEdit}>
            <MaterialIcons name="more-horiz" size={20} color={iconColor} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: UI.MIN_TOUCH_TARGET_SIZE,
  },
  textWrapper: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  text: {
    fontSize: 17, // 16-17px is good for readability
    fontWeight: "500",
  },
  subtext: {
    marginTop: 2,
    opacity: 0.8,
  },
  strikeLine: {
    position: "absolute",
    height: 2,
    backgroundColor: "#94A3B8", // Slate-400
    top: "50%", // Centered vertically over text
    left: 0,
    marginTop: -1, // Adjust for height
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
