import { StyleSheet, View } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import { UI } from "@/lib/constants/app";
import React from "react";
import { ThemedText } from "./themed-text";
import { ProgressTrackerProps } from "./types";

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  label,
  completed,
  total,
  progress,
}) => {
  const primaryColor = useThemeColor({}, "primary");
  const accentColor = useThemeColor({}, "accent");
  const backgroundColor = useThemeColor({}, "backgroundSecondary");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const textTertiaryColor = useThemeColor({}, "textTertiary");

  // Use different colors for tasks vs habits
  const fillColor = label === "Tasks" ? primaryColor : accentColor;

  return (
    <View style={styles.tracker}>
      <ThemedText
        type="caption"
        style={[styles.trackerLabel, { color: textTertiaryColor }]}
      >
        {label}
      </ThemedText>
      <ThemedText
        type="bodySemiBold"
        style={[styles.trackerCount, { color: textSecondaryColor }]}
      >
        {completed}/{total}
      </ThemedText>
      <View style={[styles.trackerBar, { backgroundColor }]}>
        <View
          style={[
            styles.trackerFill,
            {
              width: `${progress}%`,
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tracker: {
    flex: 1,
  },
  trackerLabel: {
    marginBottom: UI.SPACING.XS,
    opacity: 0.8,
  },
  trackerCount: {
    marginBottom: UI.SPACING.SM,
  },
  trackerBar: {
    height: 8,
    borderRadius: UI.BORDER_RADIUS.SM,
    overflow: "hidden",
  },
  trackerFill: {
    height: "100%",
    borderRadius: UI.BORDER_RADIUS.SM,
  },
});
