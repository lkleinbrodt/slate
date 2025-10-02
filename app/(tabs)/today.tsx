import {
  HabitsSection,
  PlannerHeader,
  TodayTasksSection,
} from "@/components/planner";
import { ScrollView, StyleSheet, View } from "react-native";

import { FloatingActionButton } from "@/components/FloatingActionButton";
import { SafeAreaThemedView } from "@/components/safe-area-themed-view";
import { useAppStore } from "@/lib/stores/appStore";
import { SheetManager } from "react-native-actions-sheet";

export default function TodayScreen() {
  const {
    todayTasks,
    activeHabits,
    todaysHabitCompletions,
    completeTask,
    undoCompleteTask,
    completeHabit,
    undoHabit,
    skipTaskForToday,
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
