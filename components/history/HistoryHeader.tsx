import { StyleSheet, View } from "react-native";

import { TabHeader } from "@/components/shared/TabHeader";
import { ThemedText } from "@/components/themed-text";
import { useHistoryStore } from "@/lib/stores/historyStore";
import React from "react";

export const HistoryHeader = () => {
  const overallStats = useHistoryStore((s) => s.overallStats);
  return (
    <TabHeader title="History">
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <ThemedText type="bodySemiBold">
            {overallStats.tasksCompleted7d}
          </ThemedText>
          <ThemedText>Tasks Done (7d)</ThemedText>
        </View>
        <View style={styles.statBox}>
          <ThemedText type="bodySemiBold">
            {overallStats.perfectDays}
          </ThemedText>
          <ThemedText>Perfect Days</ThemedText>
        </View>
      </View>
    </TabHeader>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: "row",
    marginTop: 20,
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
