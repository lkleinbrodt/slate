import { StyleSheet, View } from "react-native";

import React from "react";
import { ThemedText } from "@/components/themed-text";
import { useHabitStreaks } from "@/hooks/useHabitStreaks";
import { useSettingsStore } from "@/lib/stores/settings";
import { useSlateStore } from "@/lib/stores/slateStore";

export const HabitStreaksSection = () => {
  const { habits } = useSlateStore();
  const dayStart = useSettingsStore((s) => s.dayStart);
  const streaks = useHabitStreaks({ dayStart });

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Current Streaks
      </ThemedText>
      {habits.map((habit) => (
        <View key={habit.id} style={styles.habitRow}>
          <ThemedText style={styles.habitTitle}>{habit.title}</ThemedText>
          <ThemedText style={styles.streakText}>
            🔥 {streaks[habit.id] || 0}
          </ThemedText>
        </View>
      ))}
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
