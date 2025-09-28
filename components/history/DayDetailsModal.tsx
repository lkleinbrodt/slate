import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ActionSheet, {
  SheetManager,
  SheetProps,
} from "react-native-actions-sheet";

import { HabitItem } from "@/components/HabitItem";
import { TaskItem } from "@/components/TaskItem";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DayDetailsModalProps = SheetProps<"day-details-sheet">;

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  sheetId,
  payload,
}) => {
  const insets = useSafeAreaInsets();
  const { snapshot, onClose } = payload || {};

  if (!snapshot) return null;

  // Dummy functions for read-only view
  const dummyOnToggle = () => {};

  const handleClose = () => {
    onClose?.();
    SheetManager.hide(sheetId);
  };

  return (
    <ActionSheet id={sheetId} gestureEnabled={true} safeAreaInsets={insets}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Details for {snapshot.date}</Text>
            {snapshot.isPerfectDay && (
              <Text style={styles.perfectDay}>🎉 Perfect Day!</Text>
            )}
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Habits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Habits</Text>
            {snapshot.habits.map((h: any) => (
              <HabitItem
                key={h.habit_history.id}
                habit={h.habits}
                isCompleted={h.habit_history.completed}
                streak={0}
                onToggle={dummyOnToggle}
                isReadOnly={true}
              />
            ))}
          </View>

          {/* Tasks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tasks</Text>
            {snapshot.tasks.map((t: any) => (
              <TaskItem
                key={t.task_history.id}
                task={t.tasks}
                isCompleted={t.task_history.completed}
                onToggle={dummyOnToggle}
                isReadOnly={true}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </ActionSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  perfectDay: {
    fontSize: 16,
    color: "#10B981",
    fontWeight: "600",
    marginTop: 4,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#6B7280",
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
});
