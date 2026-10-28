import {
  HabitsSection,
  PlannerHeader,
  TodayTasksSection,
} from "@/components/planner";
import { ScrollView, StyleSheet, View } from "react-native";

import { FloatingActionButton } from "@/components/FloatingActionButton";
import { SafeAreaThemedView } from "@/components/safe-area-themed-view";
import { useAppStore } from "@/lib/stores/appStore";
import { displayStreak } from "@/lib/logic/streaks";
import { SheetManager } from "react-native-actions-sheet";

export default function TodayScreen() {
  const {
    todayTasks,
    activeHabits,
    todaysHabitCompletions,
    habitBaseStreaks,
    toggleTask,
    toggleHabit,
    skipTaskForToday,
    sendTaskBackToSlate,
  } = useAppStore();

  const completedTodayTasks = todayTasks.filter((t) => t.status === "done");
  // Only count completions of habits that are still active
  const completedHabitIds = new Set(
    todaysHabitCompletions.map((c) => c.habitId)
  );
  const completedActiveHabits = activeHabits.filter((h) =>
    completedHabitIds.has(h.id)
  );
  const habitStreaks = Object.fromEntries(
    activeHabits.map((h) => [
      h.id,
      displayStreak(habitBaseStreaks[h.id] ?? 0, completedHabitIds.has(h.id)),
    ])
  );

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
          completedHabitsCount={completedActiveHabits.length}
          totalHabitsCount={activeHabits.length}
        />

        <View style={styles.sectionsContainer}>
          <HabitsSection
            habits={activeHabits}
            completedHabits={completedActiveHabits}
            habitStreaks={habitStreaks}
            onToggle={handleHabitToggle}
          />

          <TodayTasksSection
            tasks={todayTasks}
            onToggle={(taskId, currentStatus) =>
              handleTaskToggle(taskId, currentStatus)
            }
            onSkipForToday={skipTaskForToday}
            onSendToSlate={sendTaskBackToSlate}
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
