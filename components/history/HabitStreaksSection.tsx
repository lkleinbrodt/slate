import { StyleSheet, View } from "react-native";

import React from "react";
import { ThemedText } from "@/components/themed-text";
import { useHistoryStore } from "@/lib/stores/historyStore";
import { useThemeColor } from "@/hooks/use-theme-color";

export const HabitStreaksSection = () => {
  const { overallStats } = useHistoryStore();
  const primaryColorLight = useThemeColor({}, "primaryLight");

  return (
    <View style={styles.container}>
      <ThemedText type="h3" style={styles.title}>
        Current Streaks
      </ThemedText>
      {Object.entries(overallStats.currentStreaks).map(
        ([habitId, habitData]) => (
          <View
            key={habitId}
            style={[styles.habitRow, { backgroundColor: primaryColorLight }]}
          >
            <ThemedText style={styles.habitTitle}>{habitData.title}</ThemedText>
            <ThemedText style={styles.streakText}>
              🔥 {habitData.streak}
            </ThemedText>
          </View>
        )
      )}
      {Object.entries(overallStats.currentStreaks).length === 0 && (
        <View style={styles.habitRow}>
          <ThemedText style={styles.habitTitle}>No current streaks</ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 20,
  },
  title: {
    marginBottom: 15,
  },
  habitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  habitTitle: {
    flex: 1,
    fontSize: 16,
  },
  streakText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
