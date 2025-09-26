import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useHistoryStore } from "@/lib/stores/historyStore";
import React from "react";

export const HabitStreaksSection = () => {
  const { overallStats } = useHistoryStore();

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Current Streaks
      </ThemedText>
      {Object.entries(overallStats.currentStreaks).map(
        ([habitId, habitData]) => (
          <View key={habitId} style={styles.habitRow}>
            <ThemedText style={styles.habitTitle}>{habitData.title}</ThemedText>
            <ThemedText style={styles.streakText}>
              🔥 {habitData.streak}
            </ThemedText>
          </View>
        )
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
    backgroundColor: "rgba(0, 122, 255, 0.05)",
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
