import Animated, { FadeOut, LinearTransition } from "react-native-reanimated";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SlateItem } from "@/components/SlateItem";
import { Task } from "@/components/types";
import { formatRelativeDay } from "@/lib/utils/dateFormat";
import { useTheme } from "@/hooks/use-theme";
import { useTimeStore } from "@/lib/stores/timeStore";

interface SlateSectionProps {
  tasks: Task[];
  onAddToToday: (type: "task" | "habit", id: string) => void;
  onAdd: () => void;
}

interface TaskSection {
  key: string;
  title: string;
  tasks: Task[];
}

export const SlateSection: React.FC<SlateSectionProps> = ({
  tasks,
  onAddToToday,
  onAdd,
}) => {
  const { colors } = useTheme();
  const todayDate = useTimeStore((s) => s.currentDate);

  const sections = useMemo(() => {
    // Within a section: earliest due date first (undated last), then oldest
    const byDueThenCreated = (a: Task, b: Task) =>
      (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31") ||
      a.createdAt.localeCompare(b.createdAt);
    const sortedTasks = [...tasks].sort(byDueThenCreated);
    const scheduledTasks = sortedTasks.filter((task) => task.scheduledFor);
    const unscheduledTasks = sortedTasks.filter((task) => !task.scheduledFor);

    // Group scheduled tasks by date (anything before today shows under Today)
    const tasksByDate = scheduledTasks.reduce((acc, task) => {
      const date =
        task.scheduledFor! < todayDate ? todayDate : task.scheduledFor!;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    // Soonest first, then everything without a day
    const result: TaskSection[] = Object.keys(tasksByDate)
      .sort()
      .map((date) => ({
        key: date,
        title: formatRelativeDay(date, todayDate),
        tasks: tasksByDate[date],
      }));
    if (unscheduledTasks.length > 0) {
      result.push({ key: "someday", title: "Someday", tasks: unscheduledTasks });
    }
    return result;
  }, [tasks, todayDate]);

  if (tasks.length === 0) {
    return (
      <Card variant="sunken" style={styles.empty}>
        <EmptyState
          art="tablet"
          title="A clean slate"
          body="Everything you'd like to do some day lives here. Pull tasks into Today when you're ready for them."
          actionTitle="Add a task"
          onAction={onAdd}
        />
      </Card>
    );
  }

  return (
    <View style={styles.sections}>
      {sections.map((section) => (
        <Animated.View key={section.key} layout={LinearTransition} exiting={FadeOut}>
          <SectionHeader title={section.title} detail={String(section.tasks.length)} />
          <Card padded={false} clip>
            {section.tasks.map((task, i) => (
              <Animated.View
                key={task.id}
                layout={LinearTransition.springify().damping(18)}
                exiting={FadeOut.duration(180)}
              >
                {i > 0 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
                <SlateItem task={task} onAddToToday={onAddToToday} />
              </Animated.View>
            ))}
          </Card>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  sections: { gap: 24 },
  empty: { marginTop: 8 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
});
