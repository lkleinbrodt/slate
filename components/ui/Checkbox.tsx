import * as Haptics from "expo-haptics";

import Animated, {
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import React, { useEffect, useRef } from "react";
import Svg, { Path } from "react-native-svg";

import { Motion } from "@/constants/theme";
import { Pressable } from "react-native";
import { useTheme } from "@/hooks/use-theme";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const CHECK_LENGTH = 20;

interface CheckboxProps {
  checked: boolean;
  onPress?: () => void;
  /** Fill color when checked; defaults to the primary (sunrise) color */
  color?: string;
  size?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
}

/**
 * A round check pressed into the surface. Checking it fills it, draws the
 * tick, and sends a ripple out from the edge.
 */
export function Checkbox({
  checked,
  onPress,
  color,
  size = 28,
  disabled = false,
  accessibilityLabel,
}: CheckboxProps) {
  const { colors } = useTheme();
  const fill = color ?? colors.primary;
  const progress = useSharedValue(checked ? 1 : 0);
  const scale = useSharedValue(1);
  const ripple = useSharedValue(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    progress.value = withTiming(checked ? 1 : 0, {
      duration: checked ? Motion.slow : Motion.fast,
    });
    if (checked) {
      scale.value = withSequence(
        withTiming(0.82, { duration: 90 }),
        withSpring(1, Motion.springBouncy)
      );
      ripple.value = 0;
      ripple.value = withTiming(1, { duration: 520 });
    }
  }, [checked, progress, scale, ripple]);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      Math.min(progress.value * 2, 1),
      [0, 1],
      [colors.surfaceSunken, fill]
    ),
    borderColor: interpolateColor(
      Math.min(progress.value * 2, 1),
      [0, 1],
      [colors.borderStrong, fill]
    ),
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: ripple.value === 0 ? 0 : (1 - ripple.value) * 0.5,
    transform: [{ scale: 1 + ripple.value * 0.9 }],
  }));

  const checkProps = useAnimatedProps(() => {
    const drawn = Math.max(0, progress.value * 1.6 - 0.6);
    return {
      strokeDashoffset: CHECK_LENGTH * (1 - drawn),
      // A round cap would leave a dot before the tick starts drawing
      strokeOpacity: drawn > 0.01 ? 1 : 0,
    };
  });

  const handlePress = () => {
    if (disabled || !onPress) return;
    Haptics.impactAsync(
      checked ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => {
        if (!disabled) scale.value = withSpring(0.88, Motion.spring);
      }}
      onPressOut={() => {
        if (!disabled) scale.value = withSpring(1, Motion.springBouncy);
      }}
      hitSlop={12}
      disabled={disabled || !onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
      style={{ width: size, height: size }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: fill,
          },
          rippleStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1.5,
            alignItems: "center",
            justifyContent: "center",
          },
          boxStyle,
        ]}
      >
        <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
          <AnimatedPath
            d="M5 12.5 L10 17.5 L19 7"
            stroke={colors.onPrimary}
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={CHECK_LENGTH}
            animatedProps={checkProps}
          />
        </Svg>
      </Animated.View>
    </Pressable>
  );
}
