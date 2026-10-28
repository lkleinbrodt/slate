import { StyleSheet, View } from "react-native";

import React from "react";
import { ThemedText } from "@/components/themed-text";

interface SectionHeaderProps {
  title: string;
  /** Right-aligned detail, e.g. "2 of 5" */
  detail?: string;
  accessory?: React.ReactNode;
}

export function SectionHeader({ title, detail, accessory }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <ThemedText type="eyebrow" tone="textSecondary">
        {title}
      </ThemedText>
      <View style={styles.right}>
        {detail && (
          <ThemedText type="captionMedium" tone="textTertiary">
            {detail}
          </ThemedText>
        )}
        {accessory}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
});
