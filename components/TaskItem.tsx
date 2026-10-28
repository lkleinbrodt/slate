import Animated, {
  type SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ActionSheetIOS, Pressable, StyleSheet, View } from "react-native";
import React, { useEffect, useRef } from "react";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";

import { Checkbox } from "@/components/ui/Checkbox";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { SheetManager } from "react-native-actions-sheet";
import { TaskItemProps } from "./types";
import { ThemedText } from "./themed-text";
import { formatRelativeDay } from "@/lib/utils/dateFormat";
import { haptic } from "@/components/ui/PressableScale";
import { useAppStore } from "@/lib/stores/appStore";
import { useTheme } from "@/hooks/use-theme";
import { useTimeStore } from "@/lib/stores/timeStore";

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isCompleted,
  onToggle,
  onSkipForToday,
  onSendToSlate,
  isReadOnly = false,
}) => {
  const { colors, isDark } = useTheme();
  const todayDate = useTimeStore((s) => s.currentDate);
  const getTaskById = useAppStore((s) => s.getTaskById);
  const swipeRef = useRef<SwipeableMethods>(null);
  // Use the prop, not task.status: history passes whether it was done *that day*
  const isDone = isCompleted;
  // Read-only rows are past days in History, where "overdue" vs today is meaningless
  const isOverdue =
    !isReadOnly && !isDone && !!task.dueDate && task.dueDate < todayDate;
  const dependency = task.dependsOnTaskId ? getTaskById(task.dependsOnTaskId) : undefined;

  const done = useSharedValue(isDone ? 1 : 0);
  useEffect(() => {
    done.value = withTiming(isDone ? 1 : 0, { duration: 280 });
  }, [isDone, done]);

  const strikeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: done.value }],
    opacity: done.value,
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(done.value, [0, 1], [1, 0.45]),
  }));

  const openEdit = () => {
    if (isReadOnly) return;
    SheetManager.show("add-edit-modal", {
      payload: { mode: "edit", type: "task", itemId: task.id },
    });
  };

  const openMenu = () => {
    haptic("selection");
    const options = [
      ...(!isDone && onSkipForToday ? ["Snooze until tomorrow"] : []),
      ...(!isDone && onSendToSlate ? ["Send back to the Slate"] : []),
      "Edit",
      "Cancel",
    ];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        title: task.title,
        userInterfaceStyle: isDark ? "dark" : "light",
        tintColor: colors.primary,
      },
      (index) => {
        const choice = options[index];
        if (choice === "Snooze until tomorrow") onSkipForToday?.(task.id);
        else if (choice === "Send back to the Slate") onSendToSlate?.(task.id);
        else if (choice === "Edit") openEdit();
      }
    );
  };

  const swipeAction = (action?: (id: string) => void) => () => {
    swipeRef.current?.close();
    haptic("light");
    // Let the row close before it leaves the list
    setTimeout(() => action?.(task.id), 180);
  };

  const meta = (
    <View style={styles.meta}>
      {task.dueDate && (
        <Chip
          icon="flag"
          tone={isOverdue ? "error" : isDone ? "neutral" : "streak"}
          label={dueLabel(task.dueDate, todayDate, isOverdue)}
        />
      )}
      {dependency && dependency.status === "open" && (
        <Chip icon="link" label={`After “${dependency.title}”`} style={styles.depChip} />
      )}
      {!!task.notes && <Icon name="note" size={14} color="textTertiary" />}
    </View>
  );
  const hasMeta = !!task.dueDate || (!!dependency && dependency.status === "open") || !!task.notes;

  const row = (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      {!isReadOnly ? (
        <Checkbox
          checked={isDone}
          onPress={() => onToggle(task.id, isDone)}
          accessibilityLabel={`Complete ${task.title}`}
        />
      ) : (
        <View
          style={[
            styles.readOnlyDot,
            { backgroundColor: isDone ? colors.primary : colors.surfaceSunken, borderColor: isDone ? colors.primary : colors.borderStrong },
          ]}
        >
          {isDone && <Icon name="check" size={12} color={colors.onPrimary} weight="bold" />}
        </View>
      )}

      <Pressable
        onPress={openEdit}
        disabled={isReadOnly}
        style={styles.body}
        accessibilityRole="button"
        accessibilityHint="Opens the task to edit"
      >
        <View style={styles.titleWrap}>
          <Animated.View style={titleStyle}>
            <ThemedText type="bodyMedium">{task.title}</ThemedText>
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[styles.strike, { backgroundColor: colors.textTertiary }, strikeStyle]}
          />
        </View>
        {hasMeta && meta}
      </Pressable>

      {!isReadOnly && (
        <Pressable
          onPress={openMenu}
          hitSlop={8}
          style={styles.more}
          accessibilityLabel="More actions"
        >
          <Icon name="dots" size={22} color="textTertiary" weight="bold" />
        </Pressable>
      )}
    </View>
  );

  if (isReadOnly || isDone || (!onSkipForToday && !onSendToSlate)) return row;

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={1.6}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={(progress) => (
        <View style={styles.actions}>
          {onSkipForToday && (
            <SwipeAction
              progress={progress}
              icon="moonStars"
              label="Tomorrow"
              color={colors.streak}
              fg={colors.onPrimary}
              onPress={swipeAction(onSkipForToday)}
            />
          )}
          {onSendToSlate && (
            <SwipeAction
              progress={progress}
              icon="tray"
              label="Slate"
              color={colors.text}
              fg={colors.background}
              onPress={swipeAction(onSendToSlate)}
            />
          )}
        </View>
      )}
    >
      {row}
    </ReanimatedSwipeable>
  );
};

export function dueLabel(dueDate: string, today: string, isOverdue: boolean) {
  const day = formatRelativeDay(dueDate, today);
  if (isOverdue) return `Overdue · ${day}`;
  return `Due ${day === "Today" || day === "Tomorrow" ? day.toLowerCase() : day}`;
}

function SwipeAction({
  progress,
  icon,
  label,
  color,
  fg,
  onPress,
}: {
  progress: SharedValue<number>;
  icon: "moonStars" | "tray";
  label: string;
  color: string;
  fg: string;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6, 1], [0, 0.6, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.7, 1], "clamp") }],
  }));
  return (
    <Pressable onPress={onPress} style={[styles.action, { backgroundColor: color }]}>
      <Animated.View style={[styles.actionInner, style]}>
        <Icon name={icon} size={20} color={fg} weight="duotone" duotoneOpacity={0.35} />
        <ThemedText type="captionMedium" style={{ color: fg }}>
          {label}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 8,
    gap: 14,
    minHeight: 60,
  },
  body: {
    flex: 1,
    gap: 6,
    justifyContent: "center",
  },
  titleWrap: { alignSelf: "flex-start" },
  strike: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: 1.5,
    transformOrigin: "left",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  depChip: { maxWidth: 220 },
  more: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  readOnlyDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
  },
  action: {
    width: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  actionInner: { alignItems: "center", gap: 4 },
});
