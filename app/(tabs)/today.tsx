import {
  HabitsSection,
  PlannerHeader,
  TodayTasksSection,
} from "@/components/planner";
import * as Haptics from "expo-haptics";

import { ScrollView, StyleSheet, View } from "react-native";
import { useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { PlanWithVoiceButton } from "@/components/voice/PlanWithVoiceButton";
import { Screen } from "@/components/ui/Screen";
import { SheetManager } from "react-native-actions-sheet";
import { displayStreak } from "@/lib/logic/streaks";
import { useAppStore } from "@/lib/stores/appStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTabBarSpace } from "@/components/TabBar";

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const router = useRouter();

  // slate://add (app/add.tsx) lands here with ?add=1: open the add sheet once.
  // Wait a tick: on a cold start Today can mount in the same commit as the
  // SheetProvider, whose listeners attach in effects that run after this one.
  const { add } = useLocalSearchParams<{ add?: string }>();
  useEffect(() => {
    if (!add) return;
    const timer = setTimeout(() => {
      router.setParams({ add: undefined });
      SheetManager.show("add-edit-modal", { payload: { mode: "add" } });
    }, 0);
    return () => clearTimeout(timer);
  }, [add, router]);
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

  // A little reward when the last habit or the last task of the day is done
  const allHabitsDone =
    activeHabits.length > 0 && completedActiveHabits.length === activeHabits.length;
  const allTasksDone =
    todayTasks.length > 0 && completedTodayTasks.length === todayTasks.length;
  const previous = useRef({ allHabitsDone, allTasksDone });
  useEffect(() => {
    const before = previous.current;
    if ((allHabitsDone && !before.allHabitsDone) || (allTasksDone && !before.allTasksDone)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    previous.current = { allHabitsDone, allTasksDone };
  }, [allHabitsDone, allTasksDone]);

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

        <PlanWithVoiceButton style={styles.voice} />

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
  voice: { marginHorizontal: 20, marginTop: -8, marginBottom: 24 },
  sections: {
    paddingHorizontal: 16,
    gap: 28,
  },
});
