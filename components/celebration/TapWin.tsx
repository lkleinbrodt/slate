import * as Haptics from "expo-haptics";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Pressable, View } from "react-native";

import { CheckMorph } from "./CheckMorph";
import React from "react";

interface TapWinProps {
  checked: boolean;
  onPress: () => void;
  size?: number;
  color?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  onLevelUp?: () => void; // Callback for level up animation
}

export function TapWin({
  checked,
  onPress,
  size = 28,
  color = "#10b981",
  disabled = false,
  children,
  onLevelUp,
}: TapWinProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (disabled) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Scale animation
    scale.value = withSequence(
      withTiming(0.92, { duration: 100 }),
      withTiming(1.05, { duration: 120 }),
      withTiming(1, { duration: 100 })
    );

    // Trigger level up animation on completion
    if (!checked && onLevelUp) {
      onLevelUp();
    }

    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View>
      <Pressable onPress={handlePress} disabled={disabled}>
        <Animated.View
          style={[
            {
              width: size,
              height: size,
              borderRadius: 8,
              backgroundColor: checked ? color : "transparent",
              borderWidth: checked ? 0 : 2,
              borderColor: checked ? "transparent" : "#d1d5db",
              alignItems: "center",
              justifyContent: "center",
            },
            animatedStyle,
          ]}
        >
          {checked ? (
            <CheckMorph checked={checked} size={size * 0.6} color="white" />
          ) : (
            children
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}
