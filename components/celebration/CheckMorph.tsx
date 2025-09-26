import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import React from "react";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface CheckMorphProps {
  checked: boolean;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function CheckMorph({
  checked,
  size = 24,
  color = "#10b981",
  strokeWidth = 3,
}: CheckMorphProps) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (checked) {
      // Morph animation: scale down, then up, then draw checkmark
      scale.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withTiming(1.1, { duration: 150 }),
        withTiming(1, { duration: 100 })
      );
      progress.value = withDelay(150, withTiming(1, { duration: 300 }));
    } else {
      progress.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [checked, progress, scale]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: 24 * (1 - progress.value),
  }));

  const animatedStyle = useAnimatedProps(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <AnimatedPath
          d="M4 12 L10 18 L20 6"
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={24}
          strokeLinecap="round"
          strokeLinejoin="round"
          animatedProps={animatedProps}
        />
      </Svg>
    </Animated.View>
  );
}
