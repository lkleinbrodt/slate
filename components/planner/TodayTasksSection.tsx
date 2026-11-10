import Animated, { LinearTransition } from "react-native-reanimated";
import { StyleSheet, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import React, { useEffect, useReducer, useRef } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Task } from "@/components/types";
import { TaskItem } from "@/components/TaskItem";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/use-theme";

// A task just ticked off stays where it was tapped while the check and strike-through
// play, then sinks to the bottom in one smooth move (no spring: that jiggled every row)
const SETTLE_MS = 650;
const rowLayout = LinearTransition.duration(260);

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

  // Done tasks that have already sunk to the bottom. One just ticked isn't here yet.
  const settled = useRef<Set<string> | null>(null);
  settled.current ??= new Set(tasks.filter((t) => t.status === "done").map((t) => t.id));
  for (const t of tasks) if (t.status !== "done") settled.current.delete(t.id);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    for (const t of tasks) {
      const ticked = t.status === "done" && !settled.current!.has(t.id);
      const timer = timers.current.get(t.id);
      if (ticked && !timer) {
        timers.current.set(
          t.id,
          setTimeout(() => {
            timers.current.delete(t.id);
            settled.current!.add(t.id);
            rerender();
          }, SETTLE_MS)
        );
      } else if (!ticked && timer) {
        clearTimeout(timer);
        timers.current.delete(t.id);
      }
    }
  }, [tasks]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // Open tasks first, settled done ones at the bottom (stable within each group)
  const sinks = (t: Task) => t.status === "done" && settled.current!.has(t.id);
  const sortedTasks = [...tasks].sort((a, b) => Number(sinks(a)) - Number(sinks(b)));

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
            <Animated.View key={task.id} layout={rowLayout}>
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
