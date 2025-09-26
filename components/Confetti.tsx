import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";

interface ConfettiProps {
  visible: boolean;
  onComplete?: () => void;
}

const ConfettiPiece = ({
  delay,
  color,
  size,
}: {
  delay: number;
  color: string;
  size: number;
}) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withSequence(
        withTiming(400, { duration: 600 }),
        withTiming(400, { duration: 0 })
      )
    );

    translateX.value = withDelay(
      delay,
      withTiming(Math.random() * 200 - 100, { duration: 600 })
    );

    rotation.value = withDelay(delay, withTiming(360, { duration: 600 }));

    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 500 })
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          backgroundColor: color,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    />
  );
};

export default function Confetti({ visible, onComplete }: ConfettiProps) {
  if (!visible) return null;

  const colors = ["#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];
  const pieces = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 50,
    color: colors[i % colors.length],
    size: Math.random() * 8 + 4,
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          delay={piece.delay}
          color={piece.color}
          size={piece.size}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  confettiPiece: {
    position: "absolute",
    borderRadius: 2,
  },
});
