import { Pressable, StyleSheet, View } from "react-native";
import { Radius } from "@/constants/theme";

import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { PressableScale } from "@/components/ui/PressableScale";
import React from "react";
import { SheetManager } from "react-native-actions-sheet";
import { SlateItemProps } from "./types";
import { ThemedText } from "./themed-text";
import { dueLabel } from "./TaskItem";
import { useAppStore } from "@/lib/stores/appStore";
import { useTheme } from "@/hooks/use-theme";
import { useTimeStore } from "@/lib/stores/timeStore";

export const SlateItem: React.FC<SlateItemProps> = ({ task, onAddToToday }) => {
  const { colors } = useTheme();
  const skipTaskForToday = useAppStore((s) => s.skipTaskForToday);
  const todayDate = useTimeStore((s) => s.currentDate);

  // Scheduled for today (or an earlier day it rolled over from)
  const isScheduledForToday =
    !!task.scheduledFor && task.scheduledFor <= todayDate;
  const isOverdue = !!task.dueDate && task.dueDate < todayDate;

  const openEdit = () =>
    SheetManager.show("add-edit-modal", {
      payload: { mode: "edit", type: "task", itemId: task.id },
    });

  return (
    <View style={styles.row}>
      <Pressable onPress={openEdit} style={styles.body} accessibilityRole="button">
        <ThemedText type="bodyMedium">{task.title}</ThemedText>
        {(task.dueDate || task.notes) && (
          <View style={styles.meta}>
            {task.dueDate && (
              <Chip
                icon="flag"
                tone={isOverdue ? "error" : "streak"}
                label={dueLabel(task.dueDate, todayDate, isOverdue)}
              />
            )}
            {!!task.notes && <Icon name="note" size={14} color="textTertiary" />}
          </View>
        )}
      </Pressable>

      {isScheduledForToday ? (
        <PressableScale
          onPress={() => skipTaskForToday(task.id)}
          haptics="light"
          style={[styles.action, { backgroundColor: colors.surfaceSunken }]}
          accessibilityLabel="Snooze until tomorrow"
        >
          <Icon name="moonStars" size={16} color="textSecondary" weight="bold" />
          <ThemedText type="captionMedium" tone="textSecondary">
            Later
          </ThemedText>
        </PressableScale>
      ) : (
        <PressableScale
          onPress={() => onAddToToday("task", task.id)}
          haptics="medium"
          style={[styles.action, { backgroundColor: colors.primarySoft }]}
          accessibilityLabel="Do it today"
        >
          <Icon name="sun" size={16} color="primary" weight="bold" />
          <ThemedText type="captionMedium" tone="primary">
            Today
          </ThemedText>
        </PressableScale>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    minHeight: 60,
  },
  body: { flex: 1, gap: 6 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: Radius.pill,
  },
});
