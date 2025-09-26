import React, { useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";

import { HabitStreaksSection } from "@/components/history/HabitStreaksSection";
import { HistoryCalendar } from "@/components/history/HistoryCalendar";
import { HistoryHeader } from "@/components/history/HistoryHeader";
import { SafeAreaThemedView } from "@/components/safe-area-themed-view";
import { useHistoryStore } from "@/lib/stores/historyStore";
import { router } from "expo-router";

export default function HistoryScreen() {
  const { loading, selectedDay, loadInitialData } = useHistoryStore();

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle day selection by navigating to detail screen
  const handleDayPress = (date: string) => {
    router.push(`/history/${date}`);
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
