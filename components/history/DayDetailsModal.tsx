import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { DayDetails } from "@/lib/stores/historyStore";
import { HabitItem } from "@/components/HabitItem";
import React from "react";
import { TaskItem } from "@/components/TaskItem";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

interface DayDetailsModalProps {
  visible: boolean;
  snapshot: DayDetails | null;
  onClose: () => void;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  visible,
  snapshot,
  onClose,
}) => {
  if (!snapshot) return null;

  // Dummy functions for read-only view
  const dummyOnToggle = () => {};
  const dummyOnEdit = () => {};

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText type="title">Snapshot for {snapshot.date}</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Tasks */}
            <View style={styles.section}>
              <ThemedText type="subtitle">Tasks</ThemedText>
              {snapshot.tasks.map((task: any) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isCompleted={snapshot.completedTasks.some(
                    (t: any) => t.id === task.id
                  )}
                  onToggle={dummyOnToggle}
                  onEdit={dummyOnEdit}
                  isReadOnly={true}
                />
              ))}
            </View>

            {/* Habits */}
            <View style={styles.section}>
              <ThemedText type="subtitle">Habits</ThemedText>
              {snapshot.habits.map((habit: any) => (
                <HabitItem
                  key={habit.id}
                  habit={habit}
                  isCompleted={snapshot.completedHabits.some(
                    (h: any) => h.id === habit.id
                  )}
                  streak={0} // We don't have streak data in snapshots
                  onToggle={dummyOnToggle}
                  onEdit={dummyOnEdit}
                  isReadOnly={true}
                />
              ))}
            </View>
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: "#666",
  },
  modalBody: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
});
