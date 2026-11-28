import * as repo from "@/lib/logic/repo";

import { ScrollView, StyleSheet, View } from "react-native";
import React, { useCallback } from "react";

import { HabitStreaksSection } from "@/components/history/HabitStreaksSection";
import { HistoryCalendar } from "@/components/history/HistoryCalendar";
import { HistoryHeader } from "@/components/history/HistoryHeader";
import { Screen } from "@/components/ui/Screen";
import { SheetManager } from "react-native-actions-sheet";
import { useFocusEffect } from "expo-router";
import { useHistoryStore } from "@/lib/stores/historyStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTabBarSpace } from "@/components/TabBar";
import { useTimeStore } from "@/lib/stores/timeStore";

export default function HistoryScreen() {
  const { hasLoaded, loadInitialData } = useHistoryStore();
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();

  // Tabs stay mounted, so reload whenever the tab is shown to pick up changes
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [loadInitialData])
  );

  // Handle day selection by showing ActionSheet with day details
  const handleDayPress = async (date: string) => {
    try {
      const today = useTimeStore.getState().getCurrentDate();
      const snapshot = await repo.getDaySnapshot(date, today);

      SheetManager.show("day-details-sheet", { payload: { snapshot } });
    } catch (error) {
      console.error("Failed to fetch day data:", error);
    }
  };

  if (!hasLoaded) {
    return <Screen />;
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: bottomSpace }}
      >
        <View style={styles.content}>
          <HistoryHeader />
          <HistoryCalendar onDayPress={handleDayPress} />
          <HabitStreaksSection />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 24 },
});
