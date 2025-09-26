import { StyleSheet, View } from "react-native";

import React from "react";
import { TabHeader } from "@/components/shared/TabHeader";
import { ThemedText } from "@/components/themed-text";
import { useHistoryStore } from "@/lib/stores/historyStore";

export const HistoryHeader = () => {
  const stats = useHistoryStore((s) => s.stats);
  return (
    <TabHeader title="History">
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <ThemedText type="subtitle">
            {stats.tasksCompletedLast7Days}
          </ThemedText>
          <ThemedText>Tasks Done (7d)</ThemedText>
        </View>
        <View style={styles.statBox}>
          <ThemedText type="subtitle">{stats.perfectDayCount}</ThemedText>
          <ThemedText>Perfect Days</ThemedText>
        </View>
      </View>
    </TabHeader>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: "row",
    gap: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
});
