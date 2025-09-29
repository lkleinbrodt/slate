import * as Haptics from "expo-haptics";

import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Platform, StyleSheet, Text, View } from "react-native";
import React, { useCallback, useEffect } from "react";

import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// const { width } = Dimensions.get("window"); // Not currently used

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onHide: () => void;
}

export function Toast({
  visible,
  message,
  type = "success",
  duration = 2000,
  onHide,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const hideToast = useCallback(() => {
    translateY.value = withTiming(-100, { duration: 250 });
    opacity.value = withTiming(0, { duration: 250 }, () => {
      runOnJS(onHide)();
    });
  }, [translateY, opacity, onHide]);

  useEffect(() => {
    if (visible) {
      // Light haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Animate in
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(1, { duration: 300 });

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible, duration, hideToast, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: Colors.light.success,
          borderColor: Colors.light.success,
        };
      case "error":
        return {
          backgroundColor: Colors.light.error,
          borderColor: Colors.light.error,
        };
      case "info":
        return {
          backgroundColor: Colors.light.info,
          borderColor: Colors.light.info,
        };
      default:
        return {
          backgroundColor: Colors.light.success,
          borderColor: Colors.light.success,
        };
    }
  };

  const getIconName = () => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "close-circle";
      case "info":
        return "information-circle";
      default:
        return "checkmark-circle";
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 20,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.toast, getToastStyles()]}>
        <Ionicons
          name={getIconName()}
          size={20}
          color={Colors.light.textInverse}
          style={styles.icon}
        />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 1000,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  icon: {
    marginRight: 8,
  },
  message: {
    color: Colors.light.textInverse,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
});
