import { Alert, Pressable, StyleSheet, View } from "react-native";
import React, { useRef } from "react";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { Radius } from "@/constants/theme";

import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { PressableScale, haptic } from "@/components/ui/PressableScale";
import { SheetManager } from "react-native-actions-sheet";
import { SlateItemProps } from "./types";
import { SwipeAction } from "@/components/ui/SwipeAction";
import { ThemedText } from "./themed-text";
import { dueLabel } from "./TaskItem";
import { parseRule, ruleLabel } from "@/lib/logic/repeat";
import { useAppStore } from "@/lib/stores/appStore";
import { useTheme } from "@/hooks/use-theme";
import { useTimeStore } from "@/lib/stores/timeStore";

export const SlateItem: React.FC<SlateItemProps> = ({ task, onAddToToday }) => {
  const { colors } = useTheme();
  const skipTaskForToday = useAppStore((s) => s.skipTaskForToday);
  const completeTask = useAppStore((s) => s.completeTask);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const swipeRef = useRef<SwipeableMethods>(null);
  const todayDate = useTimeStore((s) => s.currentDate);

  // Scheduled for today (or an earlier day it rolled over from)
  const isScheduledForToday =
    !!task.scheduledFor && task.scheduledFor <= todayDate;
  const isOverdue = !!task.dueDate && task.dueDate < todayDate;
  const repeat = parseRule(task.repeatRule);

  const openEdit = () =>
    SheetManager.show("add-edit-modal", {
      payload: { mode: "edit", type: "task", itemId: task.id },
    });

  // Swipe right: done. Swipe left: delete. Let the row close before it leaves the list.
  const markDone = () => {
    swipeRef.current?.close();
    haptic("medium");
    setTimeout(() => completeTask(task.id), 180);
  };
  const confirmDelete = () => {
    haptic("light");
    Alert.alert("Delete this task?", task.title, [
      { text: "Cancel", style: "cancel", onPress: () => swipeRef.current?.close() },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          swipeRef.current?.close();
          setTimeout(() => deleteTask(task.id), 180);
        },
      },
    ]);
  };

  const row = (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      <Pressable onPress={openEdit} style={styles.body} accessibilityRole="button">
        <ThemedText type="bodyMedium">{task.title}</ThemedText>
        {(task.dueDate || repeat || task.notes) && (
          <View style={styles.meta}>
            {task.dueDate && (
              <Chip
                icon="flag"
                tone={isOverdue ? "error" : "streak"}
                label={dueLabel(task.dueDate, todayDate, isOverdue)}
              />
            )}
            {repeat && <Chip icon="repeat" tone="habit" label={ruleLabel(repeat)} />}
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

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={1.6}
      leftThreshold={40}
      rightThreshold={40}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={(progress) => (
        <SwipeAction
          progress={progress}
          icon="check"
          label="Done"
          color={colors.success}
          fg={colors.onPrimary}
          onPress={markDone}
        />
      )}
      renderRightActions={(progress) => (
        <SwipeAction
          progress={progress}
          icon="trash"
          label="Delete"
          color={colors.error}
          fg={colors.onPrimary}
          onPress={confirmDelete}
        />
      )}
    >
      {row}
    </ReanimatedSwipeable>
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
