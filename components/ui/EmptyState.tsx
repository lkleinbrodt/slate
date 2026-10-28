import { type IconName } from "./Icon";
import { Illustration, type IllustrationName } from "./Illustration";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Button } from "./Button";
import React from "react";
import { ThemedText } from "@/components/themed-text";

interface EmptyStateProps {
  art: IllustrationName;
  title: string;
  body?: string;
  actionTitle?: string;
  onAction?: () => void;
  actionIcon?: IconName;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  art,
  title,
  body,
  actionTitle,
  onAction,
  actionIcon = "plus",
  compact = false,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, compact && styles.compact, style]}>
      <Illustration name={art} size={compact ? 88 : 140} />
      <View style={styles.text}>
        <ThemedText type={compact ? "heading" : "title"} style={styles.center}>
          {title}
        </ThemedText>
        {body && (
          <ThemedText type="callout" tone="textSecondary" style={styles.center}>
            {body}
          </ThemedText>
        )}
      </View>
      {actionTitle && onAction && (
        <Button title={actionTitle} onPress={onAction} icon={actionIcon} size="md" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 16,
  },
  compact: { paddingVertical: 16, gap: 10 },
  text: { alignItems: "center", gap: 6, maxWidth: 300 },
  center: { textAlign: "center" },
});
