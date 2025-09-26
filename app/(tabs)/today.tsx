import { HabitsSection, TodayTasksSection } from "@/components/planner"; // These too
import { ScrollView, StyleSheet } from "react-native";

import { PlannerHeader } from "@/components/planner"; // This component will be refactored
import { SafeAreaThemedView } from "@/components/safe-area-themed-view";
import { useAppStore } from "@/lib/stores/appStore";
import React from "react";

export default function TodayScreen() {
  const {
    todayTasks,
    activeHabits,
    todaysHabitCompletions,
    completeTask,
    undoCompleteTask,
    completeHabit,
    undoHabit,
  } = useAppStore();

  const completedTodayTasks = todayTasks.filter((t) => t.status === "done");

  const handleTaskToggle = (taskId: string, isCompleted: boolean) => {
    if (isCompleted) {
      undoCompleteTask(taskId);
    } else {
      completeTask(taskId);
    }
  };

  const handleHabitToggle = (habitId: string) => {
    const isCompleted = todaysHabitCompletions.some(
      (c) => c.habitId === habitId
    );
    if (isCompleted) {
      undoHabit(habitId);
    } else {
      completeHabit(habitId);
    }
  };

  return (
    <SafeAreaThemedView style={styles.container}>
      <ScrollView>
        <PlannerHeader
          completedTasksCount={completedTodayTasks.length}
          totalTasksCount={todayTasks.length}
          completedHabitsCount={todaysHabitCompletions.length}
          totalHabitsCount={activeHabits.length}
          onAddPress={() => {
            /* Open modal */
          }}
        />

        <HabitsSection
          habits={activeHabits}
          completedHabits={todaysHabitCompletions.map((c) => ({
            id: c.habitId,
          }))}
          habitStreaks={{}} // Streaks will be calculated differently now, maybe in the component
          onToggle={handleHabitToggle}
          onEdit={() => {}}
        />

        <TodayTasksSection
          tasks={todayTasks}
          completedTasks={completedTodayTasks}
          onToggle={(taskId, currentStatus) =>
            handleTaskToggle(taskId, currentStatus)
          }
          onEdit={() => {}}
          onSkipForToday={() => {
            /* This is now 'send back to slate' */
          }}
        />
      </ScrollView>
    </SafeAreaThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
