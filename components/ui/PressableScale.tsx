import * as Haptics from "expo-haptics";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { Motion } from "@/constants/theme";
import React from "react";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type HapticKind = "light" | "medium" | "selection" | "none";

export function haptic(kind: HapticKind) {
  if (kind === "light") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else if (kind === "medium") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  else if (kind === "selection") Haptics.selectionAsync();
}

export interface PressableScaleProps extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>;
  /** How far it sinks when pressed */
  scaleTo?: number;
  haptics?: HapticKind;
}

/** Pressable that sinks slightly under the finger, like pressing into clay */
export function PressableScale({
  style,
  scaleTo = 0.97,
  haptics = "none",
  onPressIn,
  onPressOut,
  onPress,
  children,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, Motion.spring);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, Motion.springBouncy);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        haptic(haptics);
        onPress?.(e);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
