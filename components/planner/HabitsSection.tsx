import { HabitItem } from "@/components/HabitItem";
import React from "react";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

interface HabitsSectionProps {
  habits: any[];
  completedHabits: any[];
  habitStreaks: Record<string, number>;
  onToggle: (habitId: string) => void;
  onEdit: (
    type: "task" | "habit",
    id: string,
    title: string,
    notes?: string,
    dueDate?: string
  ) => void;
}

export const HabitsSection: React.FC<HabitsSectionProps> = ({
  habits,
  completedHabits,
  habitStreaks,
  onToggle,
  onEdit,
}) => {
  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Habits
      </ThemedText>
      {habits.length > 0 ? (
        <>
          {habits.map((habit) => {
            const isCompleted = completedHabits.some((h) => h.id === habit.id);
            const streak = habitStreaks[habit.id] || 0;
            return (
              <HabitItem
                key={habit.id}
                habit={habit}
                isCompleted={isCompleted}
                streak={streak}
                onToggle={onToggle}
                onEdit={onEdit}
              />
            );
          })}
        </>
      ) : (
        <ThemedView style={styles.emptySubsection}>
          <ThemedText style={styles.emptySubsectionText}>
            No habits yet
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
