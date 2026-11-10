import Animated, { type SharedValue, interpolate, useAnimatedStyle } from "react-native-reanimated";
import { Pressable, StyleSheet } from "react-native";

import { Icon, type IconName } from "./Icon";
import React from "react";
import { ThemedText } from "@/components/themed-text";

/** One button behind a swiped row: icon over label, fading in as the row opens */
export function SwipeAction({
  progress,
  icon,
  label,
  color,
  fg,
  onPress,
}: {
  progress: SharedValue<number>;
  icon: IconName;
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
    <Pressable onPress={onPress} style={[styles.action, { backgroundColor: color }]} accessibilityLabel={label}>
      <Animated.View style={[styles.inner, style]}>
        <Icon name={icon} size={20} color={fg} weight="duotone" duotoneOpacity={0.35} />
        <ThemedText type="captionMedium" style={{ color: fg }}>
          {label}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    width: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: { alignItems: "center", gap: 4 },
});
