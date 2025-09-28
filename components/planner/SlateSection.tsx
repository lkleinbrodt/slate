import { fromLocalDate, getToday } from "@/lib/logic/dates";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { SlateItem } from "@/components/SlateItem";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { UI } from "@/lib/constants/app";
import { Task } from "@/lib/types/common";
import { Ionicons } from "@expo/vector-icons";

interface SlateSectionProps {
  tasks: Task[];
  onAddToToday: (type: "task" | "habit", id: string) => void;
  dayStart: string;
}

interface TaskSection {
  title: string;
  tasks: Task[];
  isUnscheduled?: boolean;
}

const formatDateHeader = (dateStr: string, dayStart: string): string => {
  const date = fromLocalDate(dateStr);
  const today = fromLocalDate(getToday(dayStart));
  const tomorrow = today.add(1, "day");
  const dayAfterTomorrow = today.add(2, "day");

  if (date.isSame(today, "day")) {
    return "Today";
  } else if (date.isSame(tomorrow, "day")) {
    return "Tomorrow";
  } else if (date.isSame(dayAfterTomorrow, "day")) {
    return "Day After Tomorrow";
  } else {
    return date.format("MMM D, YYYY");
  }
};

export const SlateSection: React.FC<SlateSectionProps> = ({
  tasks,
  onAddToToday,
  dayStart,
}) => {
  const sections = useMemo(() => {
    const scheduledTasks = tasks.filter((task) => task.scheduledFor);
    const unscheduledTasks = tasks.filter((task) => !task.scheduledFor);

    // Group scheduled tasks by date
    const tasksByDate = scheduledTasks.reduce((acc, task) => {
      const date = task.scheduledFor!;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    // Sort dates and create sections
    const sortedDates = Object.keys(tasksByDate).sort();
    const sections: TaskSection[] = [];

    // Add scheduled sections (soonest first)
    sortedDates.forEach((date) => {
      const formattedDate = formatDateHeader(date, dayStart);
      sections.push({
        title: formattedDate,
        tasks: tasksByDate[date],
      });
    });

    // Add unscheduled section at the end
    if (unscheduledTasks.length > 0) {
      sections.push({
        title: "Unscheduled",
        tasks: unscheduledTasks,
        isUnscheduled: true,
      });
    }

    return sections;
  }, [tasks, dayStart]);

  const backgroundColor = useThemeColor({}, "backgroundSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const accentColor = useThemeColor({}, "accent");
  const borderColor = useThemeColor({}, "border");
  const textTertiaryColor = useThemeColor({}, "textTertiary");

  if (tasks.length === 0) {
    return (
      <ThemedView style={styles.section}>
        <ThemedView style={[styles.emptySubsection, { backgroundColor }]}>
          <Ionicons
            name="checkmark-done-circle"
            size={48}
            color={textTertiaryColor}
          />
          <ThemedText type="h3" style={styles.emptySubsectionTitle}>
            You&apos;re all caught up!
          </ThemedText>
          <ThemedText type="body" style={styles.emptySubsectionText}>
            No tasks in your slate. Add some tasks to get organized.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.section}>
      {sections.map((section, sectionIndex) => (
        <ThemedView key={sectionIndex} style={styles.sectionGroup}>
          <View style={[styles.sectionHeader, { backgroundColor }]}>
            <View style={styles.sectionHeaderContent}>
              <View
                style={[
                  styles.sectionIcon,
                  {
                    backgroundColor: section.isUnscheduled
                      ? accentColor
                      : primaryColor,
                  },
                ]}
              >
                <Ionicons
                  name={
                    section.isUnscheduled ? "list-outline" : "calendar-outline"
                  }
                  size={16}
                  color="white"
                />
              </View>
              <ThemedText
                type="h4"
                style={[
                  styles.sectionTitle,
                  section.isUnscheduled && styles.unscheduledTitle,
                ]}
              >
                {section.title}
              </ThemedText>
            </View>
            <View style={[styles.sectionCount, { borderColor }]}>
              <ThemedText
                type="captionSemiBold"
                style={styles.sectionCountText}
              >
                {section.tasks.length}
              </ThemedText>
            </View>
          </View>

          <View style={styles.tasksContainer}>
            {section.tasks.map((task) => (
              <SlateItem
                key={task.id}
                task={task}
                onAddToToday={onAddToToday}
              />
            ))}
          </View>
        </ThemedView>
      ))}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: UI.SPACING.LG,
    paddingTop: UI.SPACING.MD,
  },
  sectionGroup: {
    marginBottom: UI.SPACING.XL,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: UI.SPACING.MD,
    paddingVertical: UI.SPACING.SM,
    borderRadius: UI.BORDER_RADIUS.MD,
    marginBottom: UI.SPACING.SM,
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: UI.SPACING.SM,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    flex: 1,
  },
  unscheduledTitle: {
    opacity: 0.7,
    fontStyle: "italic",
  },
  sectionCount: {
    paddingHorizontal: UI.SPACING.SM,
    paddingVertical: UI.SPACING.XS,
    borderRadius: UI.BORDER_RADIUS.SM,
    borderWidth: 1,
    minWidth: 28,
    alignItems: "center",
  },
  sectionCountText: {
    opacity: 0.8,
  },
  tasksContainer: {
    paddingLeft: UI.SPACING.SM,
  },
  emptySubsection: {
    padding: UI.SPACING.XXXL,
    alignItems: "center",
    borderRadius: UI.BORDER_RADIUS.LG,
    marginVertical: UI.SPACING.SM,
    gap: UI.SPACING.MD,
  },
  emptySubsectionTitle: {
    textAlign: "center",
    opacity: 0.9,
  },
  emptySubsectionText: {
    textAlign: "center",
    opacity: 0.7,
  },
});
