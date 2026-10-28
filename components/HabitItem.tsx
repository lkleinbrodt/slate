import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Motion, Radius, shadow } from "@/constants/theme";
import { Pressable, StyleSheet, View } from "react-native";
import React, { useEffect, useRef } from "react";

import { Checkbox } from "@/components/ui/Checkbox";
import { HabitItemProps } from "./types";
import { Icon } from "@/components/ui/Icon";
import { SheetManager } from "react-native-actions-sheet";
import { ThemedText } from "./themed-text";
import { haptic } from "@/components/ui/PressableScale";
import { useTheme } from "@/hooks/use-theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** A habit as a tile in the Today grid: tap anywhere to mark it done */
export const HabitItem: React.FC<HabitItemProps> = ({
  habit,
  isCompleted,
  streak,
  onToggle,
  isReadOnly = false,
}) => {
  const { colors, scheme } = useTheme();
  const done = useSharedValue(isCompleted ? 1 : 0);
  const scale = useSharedValue(1);
  const isFirstRender = useRef(true);

  useEffect(() => {
    done.value = withTiming(isCompleted ? 1 : 0, { duration: Motion.slow });
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isCompleted) {
      scale.value = withSequence(
        withTiming(0.94, { duration: 100 }),
        withSpring(1, Motion.springBouncy)
      );
    }
  }, [isCompleted, done, scale]);

  const tileStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(done.value, [0, 1], [colors.surface, colors.habitSoft]),
    borderColor: interpolateColor(done.value, [0, 1], [colors.border, colors.habit + "55"]),
  }));

  const toggle = () => {
    if (isReadOnly) return;
    onToggle(habit.id);
  };

  const openEdit = () => {
    if (isReadOnly) return;
    haptic("medium");
    SheetManager.show("add-edit-modal", {
      payload: { mode: "edit", type: "habit", itemId: habit.id },
    });
  };

  const streakText =
    streak > 0 ? `${streak} day${streak === 1 ? "" : "s"}` : isCompleted ? "Day one" : "Not started";

  return (
    <AnimatedPressable
      onPress={() => {
        haptic(isCompleted ? "light" : "medium");
        toggle();
      }}
      onLongPress={openEdit}
      onPressIn={() => {
        scale.value = withSpring(0.96, Motion.spring);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, Motion.springBouncy);
      }}
      disabled={isReadOnly}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isCompleted }}
      accessibilityLabel={habit.title}
      accessibilityHint="Long press to edit"
      style={[styles.tile, !isCompleted && shadow(scheme, 1), tileStyle]}
    >
      <View style={styles.top}>
        {/* The tile handles the press; the check just shows state */}
        <View pointerEvents="none">
          <Checkbox checked={isCompleted} color={colors.habit} size={26} />
        </View>
        {!isReadOnly && (
          <Pressable
            onPress={openEdit}
            hitSlop={10}
            style={styles.more}
            accessibilityLabel={`Edit ${habit.title}`}
          >
            <Icon name="dots" size={20} color="textTertiary" weight="bold" />
          </Pressable>
        )}
      </View>

      <ThemedText type="bodyMedium" numberOfLines={2} style={styles.title}>
        {habit.title}
      </ThemedText>

      <View style={styles.streak}>
        <Icon
          name="fire"
          size={15}
          color={streak > 0 ? colors.streak : colors.textTertiary}
          weight={streak > 0 ? "fill" : "regular"}
        />
        <ThemedText
          type="captionMedium"
          style={{ color: streak > 0 ? colors.streak : colors.textTertiary }}
        >
          {streakText}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: 0,
    minHeight: 128,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  more: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -4,
  },
  title: { flex: 1 },
  streak: { flexDirection: "row", alignItems: "center", gap: 4 },
});
