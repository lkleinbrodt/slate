import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import React, { useEffect } from "react";

import { DayDetailsModal } from "@/components/history/DayDetailsModal";
import { HabitStreaksSection } from "@/components/history/HabitStreaksSection";
import { HistoryCalendar } from "@/components/history/HistoryCalendar";
import { HistoryHeader } from "@/components/history/HistoryHeader";
import { SafeAreaThemedView } from "@/components/safe-area-themed-view";
import { useHistoryStore } from "@/lib/stores/historyStore";

export default function HistoryScreen() {
  const { loading, selectedDay, actions } = useHistoryStore();

  useEffect(() => {
    actions.loadInitialData();
  }, [actions]);

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
        <HistoryCalendar />
        <HabitStreaksSection />
      </ScrollView>
      <DayDetailsModal
        visible={!!selectedDay}
        snapshot={selectedDay}
        onClose={actions.clearSelectedDay}
      />
    </SafeAreaThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
