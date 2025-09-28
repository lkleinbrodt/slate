import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { SectionContainer } from "@/components/planner/SectionContainer";
import { StyleSheet } from "react-native";
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
  const pendingTasks = tasks.filter((task) => task.status !== "done");
  const completedTasks = tasks.filter((task) => task.status === "done");

  const backgroundColor = useThemeColor({}, "backgroundSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const primaryColorDark = useThemeColor({}, "primaryDark");
  const primaryColorLight = useThemeColor({}, "primaryLight");
  const textTertiaryColor = useThemeColor({}, "textTertiary");

  return (
    <SectionContainer
      title="Tasks"
      subtitle={`${completedTasks.length}/${tasks.length}`}
      backgroundColor={primaryColorLight}
      titleColor={primaryColorDark}
      borderColor={primaryColor}
    >
      {tasks.length > 0 ? (
        <>
          {/* All Tasks - Pending first, then completed */}
          {pendingTasks.map((task) => (
            <Animated.View
              key={task.id}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
            >
              <TaskItem
                task={task}
                isCompleted={false}
                onToggle={onToggle}
                onSkipForToday={onSkipForToday}
              />
            </Animated.View>
          ))}
          {completedTasks.map((task) => (
            <Animated.View
              key={task.id}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
            >
              <TaskItem
                task={task}
                isCompleted={true}
                onToggle={onToggle}
                onSkipForToday={onSkipForToday}
              />
            </Animated.View>
          ))}
        </>
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
