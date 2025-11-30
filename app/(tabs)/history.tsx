import * as repo from "@/lib/logic/repo";

import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import React, { useEffect } from "react";

import { HabitStreaksSection } from "@/components/history/HabitStreaksSection";
import { HistoryCalendar } from "@/components/history/HistoryCalendar";
import { HistoryHeader } from "@/components/history/HistoryHeader";
import { SafeAreaThemedView } from "@/components/safe-area-themed-view";
import { SheetManager } from "react-native-actions-sheet";
import { useHistoryStore } from "@/lib/stores/historyStore";
import { useTimeStore } from "@/lib/stores/timeStore";

export default function HistoryScreen() {
  const { loading, selectedDay, loadInitialData } = useHistoryStore();

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle day selection by showing ActionSheet with day details
  const handleDayPress = async (date: string) => {
    try {
      const today = useTimeStore.getState().getCurrentDate();
      const snapshot = await repo.getDaySnapshot(date, today);

      // Transform to the format expected by DayDetailsModal
      const dayData = {
        date: snapshot.date,
        tasks: snapshot.tasks.map((item) => ({
          task_history: {
            id: `th-${item.task.id}-${date}`,
            date,
            taskId: item.task.id,
            planned: item.isPlanned ? 1 : 0,
            completed: item.isCompleted ? 1 : 0,
          },
          tasks: item.task,
        })),
        habits: snapshot.habits.map((item) => ({
          habit_history: {
            id: `hh-${item.habit.id}-${date}`,
            date,
            habitId: item.habit.id,
            completed: item.isCompleted ? 1 : 0,
          },
          habits: item.habit,
        })),
        isPerfectDay: snapshot.isPerfectDay,
      };

      SheetManager.show("day-details-sheet", {
        payload: {
          snapshot: dayData,
          onClose: () => {},
        },
      });
    } catch (error) {
      console.error("Failed to fetch day data:", error);
    }
  };

  if (loading && !selectedDay) {
    return (
      <SafeAreaThemedView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} />
      </SafeAreaThemedView>
    );
  }

  return (
    <SafeAreaThemedView style={styles.container}>
      <ScrollView>
        <HistoryHeader />
        <HistoryCalendar onDayPress={handleDayPress} />
        <HabitStreaksSection />
      </ScrollView>
    </SafeAreaThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
