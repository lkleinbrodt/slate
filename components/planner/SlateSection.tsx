import { fromLocalDate, getToday } from "@/lib/logic/dates";
import React, { useMemo } from "react";

import { SlateItem } from "@/components/SlateItem";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Task } from "@/lib/types/common";

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

  if (tasks.length === 0) {
    return (
      <ThemedView style={styles.section}>
        <ThemedView style={styles.emptySubsection}>
          <ThemedText style={styles.emptySubsectionText}>
            You&apos;re all caught up!
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.section}>
      {sections.map((section, sectionIndex) => (
        <ThemedView key={sectionIndex} style={styles.sectionGroup}>
          <ThemedView style={styles.sectionHeader}>
            <ThemedText
              style={[
                styles.sectionTitle,
                section.isUnscheduled && styles.unscheduledTitle,
              ]}
            >
              {section.title}
            </ThemedText>
            <ThemedText style={styles.sectionCount}>
              {section.tasks.length}
            </ThemedText>
          </ThemedView>

          {section.tasks.map((task) => (
            <SlateItem key={task.id} task={task} onAddToToday={onAddToToday} />
          ))}
        </ThemedView>
      ))}
    </ThemedView>
  );
};

const styles = {
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionGroup: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    opacity: 0.9,
  },
  unscheduledTitle: {
    opacity: 0.7,
    fontStyle: "italic" as const,
  },
  sectionCount: {
    fontSize: 14,
    opacity: 0.6,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    textAlign: "center" as const,
  },
  emptySubsection: {
    padding: 20,
    alignItems: "center" as const,
    backgroundColor: "rgba(0, 0, 0, 0.05)", // Light background that works in both themes
    borderRadius: 8,
    marginVertical: 5,
  },
  emptySubsectionText: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: "italic" as const,
  },
};
