import {
  HabitsSection,
  PlannerHeader,
  TodayTasksSection,
} from "@/components/planner";
import { ScrollView, StyleSheet, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { displayStreak } from "@/lib/logic/streaks";
import { useAppStore } from "@/lib/stores/appStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTabBarSpace } from "@/components/TabBar";

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
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

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: bottomSpace }}
      >
        <PlannerHeader
          completedTasksCount={completedTodayTasks.length}
          totalTasksCount={todayTasks.length}
          completedHabitsCount={completedActiveHabits.length}
          totalHabitsCount={activeHabits.length}
        />

        <View style={styles.sections}>
          <HabitsSection
            habits={activeHabits}
            completedHabits={completedActiveHabits}
            habitStreaks={habitStreaks}
            onToggle={toggleHabit}
          />

          <TodayTasksSection
            tasks={todayTasks}
            onToggle={(taskId) => toggleTask(taskId)}
            onSkipForToday={skipTaskForToday}
            onSendToSlate={sendTaskBackToSlate}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: {
    paddingHorizontal: 16,
    gap: 28,
  },
});
