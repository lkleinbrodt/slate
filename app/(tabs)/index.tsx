import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import {
  HabitsSection,
  PlannerHeader,
  SlateSection,
  TodayTasksSection,
} from "@/components/planner";

// Import planner components
import { PerfectDayModal } from "@/components/PerfectDayModal";
import React from "react";
import { SafeAreaThemedView } from "@/components/safe-area-themed-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { UnifiedAddModal } from "@/components/UnifiedAddModal";
import { localToday } from "@/lib/utils/clock";
import { useHabitStreaks } from "@/hooks/useHabitStreaks";
import { useModal } from "@/hooks/useModal";
import { usePerfectDay } from "@/hooks/usePerfectDay";
import { usePlanner } from "@/hooks/usePlanner";
import { useTaskCompletion } from "@/hooks/useTaskCompletion";

export default function MainScreen() {
  // Use the planner hook for centralized state management
  const { isLoading, currentDayPlan, habits, slateTasks, actions, dayStart } =
    usePlanner();

  // Use the simplified modal hook
  const {
    isModalOpen,
    editingItem,
    addModalType,
    newItemTitle,
    taskDueDate,
    editNotes,
    openForAdd,
    openForEdit,
    closeModal,
    setAddModalType,
    setNewItemTitle,
    setTaskDueDate,
    setEditNotes,
  } = useModal();

  // Custom hooks for specific UI interactions
  const habitStreaks = useHabitStreaks({
    dayStart,
  });

  const { showPerfectDay, setShowPerfectDay, handleCompleteHabit } =
    usePerfectDay({
      currentDayPlan,
      completeHabit: actions.completeHabit,
      localToday,
      dayStart,
    });

  const { handleCompleteTask } = useTaskCompletion({
    completeTask: actions.completeTask,
  });

  // Helper function to start editing an item
  const handleStartEditing = (
    type: "task" | "habit",
    id: string,
    title: string,
    notes?: string,
    dueDate?: string
  ) => {
    openForEdit({ type, id, title, notes, dueDate });
  };

  // Handle save with modal state
  const handleSave = async () => {
    try {
      await actions.saveItem({
        isEditing: !!editingItem,
        type: addModalType,
        id: editingItem?.id,
        title: newItemTitle,
        notes: editNotes,
        dueDate: taskDueDate || undefined,
      });
      closeModal();
    } catch (error) {
      console.error("Save failed:", error);
      // Don't close modal on error, let the error handling in usePlanner show the alert
    }
  };

  // Handle delete with modal state
  const handleDelete = async () => {
    if (editingItem) {
      try {
        console.log(
          "UI: Starting delete for",
          editingItem.type,
          editingItem.id
        );
        await actions.deleteItem(editingItem.type, editingItem.id);
        console.log("UI: Delete completed, closing modal");
        closeModal();
      } catch (error) {
        console.error("UI: Delete failed:", error);
        // Don't close modal on error, let the error handling in usePlanner show the alert
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaThemedView style={styles.container}>
        <ThemedView style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>
            Loading your slate...
          </ThemedText>
        </ThemedView>
      </SafeAreaThemedView>
    );
  }

  const todayTasks = currentDayPlan?.tasks || [];
  const completedTasks = currentDayPlan?.completedTasks || [];
  const completedHabits = currentDayPlan?.completedHabits || [];

  return (
    <SafeAreaThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <PlannerHeader
          completedTasksCount={completedTasks.length}
          totalTasksCount={todayTasks.length}
          completedHabitsCount={completedHabits.length}
          totalHabitsCount={habits.length}
          onAddPress={openForAdd}
        />

        <TodayTasksSection
          tasks={todayTasks}
          completedTasks={completedTasks}
          onToggle={handleCompleteTask}
          onEdit={handleStartEditing}
          onSkipForToday={(taskId) =>
            actions.removeItemFromToday("task", taskId)
          }
        />

        <HabitsSection
          habits={habits}
          completedHabits={completedHabits}
          habitStreaks={habitStreaks}
          onToggle={handleCompleteHabit}
          onEdit={handleStartEditing}
        />

        <SlateSection
          tasks={slateTasks}
          onAddToToday={actions.addItemToToday}
          onEdit={handleStartEditing}
        />
      </ScrollView>

      <PerfectDayModal
        visible={showPerfectDay}
        onClose={() => setShowPerfectDay(false)}
        onCancel={() => setShowPerfectDay(false)}
      />

      {/* Unified Add/Edit Modal */}
      <UnifiedAddModal
        visible={isModalOpen}
        type={addModalType}
        title={newItemTitle}
        dueDate={taskDueDate}
        notes={editingItem ? editNotes : undefined}
        isEditMode={!!editingItem}
        onTypeChange={setAddModalType}
        onTitleChange={setNewItemTitle}
        onDueDateChange={setTaskDueDate}
        onNotesChange={editingItem ? setEditNotes : undefined}
        onSave={handleSave}
        onCancel={closeModal}
        onDelete={editingItem ? handleDelete : undefined}
      />
    </SafeAreaThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 5,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 10,
    textAlign: "center",
    opacity: 0.7,
  },
});
