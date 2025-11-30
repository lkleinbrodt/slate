import Animated, { LinearTransition } from "react-native-reanimated";

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { SectionContainer } from "@/components/planner/SectionContainer";
import { StyleSheet, View } from "react-native";
import { TaskItem } from "@/components/TaskItem";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { UI } from "@/lib/constants/app";
import { useThemeColor } from "@/hooks/use-theme-color";

interface TodayTasksSectionProps {
  tasks: any[];
  onToggle: (taskId: string, completed: boolean) => void;
  onSkipForToday?: (taskId: string) => void;
}

export const TodayTasksSection: React.FC<TodayTasksSectionProps> = ({
  tasks,
  onToggle,
  onSkipForToday,
}) => {
  const completedTasks = tasks.filter((task) => task.status === "done");

  const backgroundColor = useThemeColor({}, "backgroundSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const primaryColorDark = useThemeColor({}, "primaryDark");
  const textTertiaryColor = useThemeColor({}, "textTertiary");

  // Sort: Open tasks first, then Done tasks
  // Important: We need a stable key, but we sort the array so "Done" items go to bottom
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === "done" ? 1 : -1;
  });

  return (
    <SectionContainer
      title="Tasks"
      subtitle={`${completedTasks.length}/${tasks.length}`}
      backgroundColor={backgroundColor}
      titleColor={primaryColorDark}
      borderColor={primaryColor}
    >
      {tasks.length > 0 ? (
        <View style={styles.list}>
          {sortedTasks.map((task) => (
            <Animated.View
              key={task.id}
              layout={LinearTransition.springify().damping(14)} // THE MAGIC SAUCE
              style={styles.itemContainer}
            >
              <TaskItem
                task={task}
                isCompleted={task.status === "done"}
                onToggle={onToggle}
                onSkipForToday={onSkipForToday}
              />
            </Animated.View>
          ))}
        </View>
      ) : (
        <ThemedView style={[styles.emptySubsection, { backgroundColor }]}>
          <Ionicons
            name="checkmark-circle-outline"
            size={32}
            color={textTertiaryColor}
          />
          <ThemedText type="body" style={styles.emptySubsectionText}>
            No tasks planned for today yet.
          </ThemedText>
          <ThemedText type="caption" style={styles.emptySubsectionSubtext}>
            Add some tasks to get started!
          </ThemedText>
        </ThemedView>
      )}
    </SectionContainer>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: 0, // Let padding in Item handle gap for larger touch target
  },
  itemContainer: {
    // Background needed for clean transitions if items overlap momentarily
    backgroundColor: "transparent",
  },
  emptySubsection: {
    padding: UI.SPACING.XXL,
    alignItems: "center",
    borderRadius: UI.BORDER_RADIUS.MD,
    marginVertical: UI.SPACING.SM,
    gap: UI.SPACING.SM,
  },
  emptySubsectionText: {
    textAlign: "center",
    opacity: 0.8,
  },
  emptySubsectionSubtext: {
    textAlign: "center",
    opacity: 0.6,
  },
});
