import { StyleSheet, View } from "react-native";

import { ProgressTrackerProps } from "./types";
import React from "react";
import { ThemedText } from "./themed-text";

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  label,
  completed,
  total,
  progress,
}) => {
  return (
    <View style={styles.tracker}>
      <ThemedText style={styles.trackerLabel}>{label}</ThemedText>
      <ThemedText style={styles.trackerCount}>
        {completed}/{total}
      </ThemedText>
      <View style={styles.trackerBar}>
        <View style={[styles.trackerFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tracker: {
    flex: 1,
  },
  trackerLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    opacity: 0.7,
  },
  trackerCount: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  trackerBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  trackerFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 3,
  },
});
