import React from "react";
import { TaskItem } from "@/components/TaskItem";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

interface TodayTasksSectionProps {
  tasks: any[];
  completedTasks: any[];
  onToggle: (taskId: string, completed: boolean) => void;
  onEdit: (
    type: "task" | "habit",
    id: string,
    title: string,
    notes?: string,
    dueDate?: string
  ) => void;
  onSkipForToday?: (taskId: string) => void;
}

export const TodayTasksSection: React.FC<TodayTasksSectionProps> = ({
  tasks,
  completedTasks,
  onToggle,
  onEdit,
  onSkipForToday,
}) => {
  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Today
      </ThemedText>

      {tasks.length > 0 ? (
        <>
          {tasks.map((task) => {
            const isCompleted = completedTasks.some((t) => t.id === task.id);
            return (
              <TaskItem
                key={task.id}
                task={task}
                isCompleted={isCompleted}
                onToggle={onToggle}
                onEdit={onEdit}
                onSkipForToday={onSkipForToday}
              />
            );
          })}
        </>
      ) : (
        <ThemedView style={styles.emptySubsection}>
          <ThemedText style={styles.emptySubsectionText}>
            No tasks planned for today yet.
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
};

const styles = {
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    marginBottom: 15,
    fontWeight: "600" as const,
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
