import { TaskItem } from "@/components/TaskItem";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React from "react";

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

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Tasks
      </ThemedText>

      {tasks.length > 0 ? (
        <>
          {/* Pending Tasks */}
          {pendingTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isCompleted={false}
              onToggle={onToggle}
              onSkipForToday={onSkipForToday}
            />
          ))}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <>
              <ThemedView style={styles.completedSection}>
                <ThemedText
                  type="subtitle"
                  style={styles.completedSectionTitle}
                >
                  Completed ({completedTasks.length})
                </ThemedText>
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    isCompleted={true}
                    onToggle={onToggle}
                    onSkipForToday={onSkipForToday}
                  />
                ))}
              </ThemedView>
            </>
          )}
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
  completedSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  completedSectionTitle: {
    marginBottom: 15,
    fontWeight: "600" as const,
    opacity: 0.7,
    fontSize: 16,
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
