import * as repo from "@/lib/logic/repo";

import React, { useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";

import { HabitStreaksSection } from "@/components/history/HabitStreaksSection";
import { HistoryCalendar } from "@/components/history/HistoryCalendar";
import { HistoryHeader } from "@/components/history/HistoryHeader";
import { SafeAreaThemedView } from "@/components/safe-area-themed-view";
import { useHistoryStore } from "@/lib/stores/historyStore";
import { SheetManager } from "react-native-actions-sheet";

export default function HistoryScreen() {
  const { loading, selectedDay, loadInitialData } = useHistoryStore();

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle day selection by showing ActionSheet with day details
  const handleDayPress = async (date: string) => {
    try {
      const [tasks, habits] = await Promise.all([
        repo.getDayTasksHistory(date),
        repo.getDayHabitsHistory(date),
      ]);

      // Check if it's a perfect day
      const perfectDay =
        habits.length > 0 && habits.every((h) => h.habit_history.completed);

      const dayData = {
        date,
        tasks,
        habits,
        isPerfectDay: perfectDay,
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
