import React, { useEffect } from "react";
import { StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  interpolateColor,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "@/hooks/use-theme-color";

interface Props {
  checked: boolean;
  onPress: () => void;
  color?: string; // Primary color
}

export const SatisfyingCheckbox = ({
  checked,
  onPress,
  color,
}: Props) => {
  const scale = useSharedValue(1);
  const checkProgress = useSharedValue(checked ? 1 : 0);
  const primaryColor = useThemeColor({}, "primary");
  const borderColor = useThemeColor({}, "border");
  const checkboxColor = color || primaryColor;

  useEffect(() => {
    checkProgress.value = withSpring(checked ? 1 : 0, {
      mass: 1,
      damping: 15,
      stiffness: 120,
    });
  }, [checked]);

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    if (!checked) {
      // Only heavy impact when turning ON
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const rContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      backgroundColor: interpolateColor(
        checkProgress.value,
        [0, 1],
        ["transparent", checkboxColor]
      ),
      borderColor: interpolateColor(
        checkProgress.value,
        [0, 1],
        [borderColor, checkboxColor]
      ),
    };
  });

  const rIconStyle = useAnimatedStyle(() => {
    return {
      opacity: checkProgress.value,
      transform: [
        {
          scale: interpolate(
            checkProgress.value,
            [0, 0.5, 1],
            [0, 0.5, 1],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} hitSlop={10}>
      <Animated.View style={[styles.box, rContainerStyle]}>
        <Animated.View style={rIconStyle}>
          <Ionicons name="checkmark" size={16} color="white" />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  box: {
    width: 28,
    height: 28,
    borderRadius: 10, // Softer corners
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

