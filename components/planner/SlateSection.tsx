import React from "react";
import { SlateItem } from "@/components/SlateItem";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

interface SlateSectionProps {
  tasks: any[];
  onAddToToday: (type: "task" | "habit", id: string) => void;
  onEdit: (
    type: "task" | "habit",
    id: string,
    title: string,
    notes?: string,
    dueDate?: string
  ) => void;
}

export const SlateSection: React.FC<SlateSectionProps> = ({
  tasks,
  onAddToToday,
  onEdit,
}) => {
  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Slate
      </ThemedText>
      {tasks.length > 0 ? (
        tasks.map((task) => (
          <SlateItem
            key={task.id}
            task={task}
            onEdit={onEdit}
            onAddToToday={onAddToToday}
          />
        ))
      ) : (
        <ThemedView style={styles.emptySubsection}>
          <ThemedText style={styles.emptySubsectionText}>
            You&apos;re all caught up!
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
