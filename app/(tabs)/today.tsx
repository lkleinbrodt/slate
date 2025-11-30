import {
  HabitsSection,
  PlannerHeader,
  TodayTasksSection,
} from "@/components/planner";
import { ScrollView, StyleSheet, View } from "react-native";

import { FloatingActionButton } from "@/components/FloatingActionButton";
import React from "react";
import { SafeAreaThemedView } from "@/components/safe-area-themed-view";
import { SheetManager } from "react-native-actions-sheet";
import { useAppStore } from "@/lib/stores/appStore";

export default function TodayScreen() {
  const {
    todayTasks,
    activeHabits,
    todaysHabitCompletions,
    toggleTask,
    toggleHabit,
    skipTaskForToday,
  } = useAppStore();

  const completedTodayTasks = todayTasks.filter((t) => t.status === "done");

  const handleTaskToggle = (taskId: string, _isCompleted: boolean) => {
    // Use the new optimistic toggleTask - it handles the state flip internally
    toggleTask(taskId);
  };

  const handleHabitToggle = (habitId: string) => {
    // Use the new optimistic toggleHabit - it handles the state flip internally
    toggleHabit(habitId);
  };

  const handleOpenAddModal = () => {
    SheetManager.show("add-edit-modal", {
      payload: { mode: "add" },
    });
  };

  return (
    <SafeAreaThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <PlannerHeader
          completedTasksCount={completedTodayTasks.length}
          totalTasksCount={todayTasks.length}
          completedHabitsCount={todaysHabitCompletions.length}
          totalHabitsCount={activeHabits.length}
        />

        <View style={styles.sectionsContainer}>
          <HabitsSection
            habits={activeHabits}
            completedHabits={todaysHabitCompletions.map((c) => ({
              id: c.habitId,
            }))}
            habitStreaks={{}} // Streaks will be calculated differently now, maybe in the component
            onToggle={handleHabitToggle}
          />

          <TodayTasksSection
            tasks={todayTasks}
            onToggle={(taskId, currentStatus) =>
              handleTaskToggle(taskId, currentStatus)
            }
            onSkipForToday={skipTaskForToday}
          />
        </View>
      </ScrollView>

      <FloatingActionButton onPress={handleOpenAddModal} />
    </SafeAreaThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: {
    flex: 1,
  },
  sectionsContainer: {
    paddingHorizontal: 16,
    gap: 24,
  },
});
