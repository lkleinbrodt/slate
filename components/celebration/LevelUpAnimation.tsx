import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import React, { useEffect } from "react";

import { StyleSheet } from "react-native";

interface LevelUpAnimationProps {
  children: React.ReactNode;
  trigger: boolean;
  onComplete?: () => void;
}

export function LevelUpAnimation({
  children,
  trigger,
  onComplete,
}: LevelUpAnimationProps) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (trigger) {
      // Level up animation sequence
      scale.value = withSequence(
        withTiming(1.25, { duration: 200 }), // Expand
        withTiming(1.25, { duration: 100 }), // Hold slightly expanded
        withTiming(1, { duration: 200 }) // Return to normal
      );

      glow.value = withSequence(
        withTiming(1, { duration: 200 }), // Glow up
        withDelay(300, withTiming(0, { duration: 500 })) // Fade glow
      );

      // Optional: slight opacity pulse
      opacity.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withTiming(1, { duration: 100 }),
        withTiming(0.9, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );

      // Call completion callback after animation
      if (onComplete) {
        setTimeout(() => onComplete(), 1000);
      }
    }
  }, [trigger, scale, glow, opacity, onComplete]);

  const animatedStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      glow.value,
      [0, 1],
      [0, 0.6],
      Extrapolate.CLAMP
    );

    const shadowRadius = interpolate(
      glow.value,
      [0, 1],
      [0, 20],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
      shadowColor: "#10b981",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius,
      elevation: glow.value * 10,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Container styles will be applied by the parent
  },
});
