import {
  HabitsSection,
  PlannerHeader,
  TodayTasksSection,
} from "@/components/planner";
import * as Haptics from "expo-haptics";

import { AppState, StyleSheet, View } from "react-native";
import Animated, { useAnimatedRef, useSharedValue } from "react-native-reanimated";
import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { PlanWithVoiceButton } from "@/components/voice/PlanWithVoiceButton";
import { Screen } from "@/components/ui/Screen";
import { SheetManager } from "react-native-actions-sheet";
import { displayStreak } from "@/lib/logic/streaks";
import { useAppStore } from "@/lib/stores/appStore";
import { useCalendarStore } from "@/lib/stores/calendarStore";
import { useTimeStore } from "@/lib/stores/timeStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTabBarSpace } from "@/components/TabBar";

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const router = useRouter();

  // slate://add (app/add.tsx) lands here with ?add=1: open the add sheet once.
  // Wait a tick: on a cold start Today can mount in the same commit as the
  // SheetProvider, whose listeners attach in effects that run after this one.
  // A timed task is held and dragged: the page must not scroll under the finger
  const [dragging, setDragging] = useState(false);
  // The page, so a task dragged toward the calendar can scroll it
  const pageRef = useAnimatedRef<Animated.ScrollView>();
  const pageMax = useSharedValue(0);
  const pageSize = useRef({ content: 0, view: 0 });
  const measurePage = (part: "content" | "view", h: number) => {
    pageSize.current[part] = h;
    pageMax.value = Math.max(0, pageSize.current.content - pageSize.current.view);
  };
  const { add } = useLocalSearchParams<{ add?: string }>();
  useEffect(() => {
    if (!add) return;
    const timer = setTimeout(() => {
      router.setParams({ add: undefined });
      SheetManager.show("add-edit-modal", { payload: { mode: "add" } });
    }, 0);
    return () => clearTimeout(timer);
  }, [add, router]);
  // Calendar: pick up moves made there and today's events, on open, on a new day and
  // whenever the app comes back to the front
  const refreshCalendar = useCalendarStore((s) => s.refresh);
  const currentDate = useTimeStore((s) => s.currentDate);
  useEffect(() => {
    refreshCalendar();
  }, [currentDate, refreshCalendar]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshCalendar();
    });
    return () => sub.remove();
  }, [refreshCalendar]);

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
      <Animated.ScrollView
        ref={pageRef}
        onContentSizeChange={(_, h) => measurePage("content", h)}
        onLayout={(e) => measurePage("view", e.nativeEvent.layout.height)}
        scrollEnabled={!dragging}
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
            onDragActive={setDragging}
            page={{ ref: pageRef, max: pageMax }}
          />
        </View>
      </Animated.ScrollView>
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
