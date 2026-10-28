import Animated, { LinearTransition } from "react-native-reanimated";
import { StyleSheet, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Task } from "@/components/types";
import { TaskItem } from "@/components/TaskItem";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/use-theme";

interface TodayTasksSectionProps {
  tasks: Task[];
  onToggle: (taskId: string, completed: boolean) => void;
  onSkipForToday?: (taskId: string) => void;
  onSendToSlate?: (taskId: string) => void;
}

export const TodayTasksSection: React.FC<TodayTasksSectionProps> = ({
  tasks,
  onToggle,
  onSkipForToday,
  onSendToSlate,
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const completedCount = tasks.filter((task) => task.status === "done").length;

  // Open tasks first, done ones sink to the bottom (stable within each group)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === "done" ? 1 : -1;
  });

  return (
    <View>
      <SectionHeader
        title="Tasks"
        detail={tasks.length ? `${completedCount} of ${tasks.length}` : undefined}
      />

      {tasks.length === 0 ? (
        <Card variant="sunken">
          <EmptyState
            compact
            art="sunrise"
            title="A clear day"
            body="Pull something in from the Slate, or add a task with +."
            actionTitle="Open the Slate"
            actionIcon="arrowRight"
            onAction={() => router.navigate("/slate")}
          />
        </Card>
      ) : (
        <Card padded={false} clip>
          {sortedTasks.map((task, i) => (
            <Animated.View key={task.id} layout={LinearTransition.springify().damping(18)}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <TaskItem
                task={task}
                isCompleted={task.status === "done"}
                onToggle={onToggle}
                onSkipForToday={onSkipForToday}
                onSendToSlate={onSendToSlate}
              />
            </Animated.View>
          ))}
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 58 },
});
