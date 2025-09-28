import * as Haptics from "expo-haptics";

import { Dimensions, Modal, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useRef, useState } from "react";

import { ConfettiCannonComponent } from "./ConfettiCannon";
import LottieView from "lottie-react-native";

interface PerfectDayCelebrationProps {
  visible: boolean;
  onClose: () => void;
  streakCount?: number;
}

const { width } = Dimensions.get("window");

export function PerfectDayCelebration({
  visible,
  onClose,
  streakCount = 0,
}: PerfectDayCelebrationProps) {
  const lottieRef = useRef<LottieView>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Note: We'll create a simple success sound or use a placeholder
  // const player = useAudioPlayer(require('../assets/sfx/level-up.mp3'));

  useEffect(() => {
    if (visible) {
      // Success haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Start confetti
      setShowConfetti(true);

      // Play Lottie animation
      lottieRef.current?.play();

      // Play sound (when available)
      // player.play();

      // Auto close after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
      // player.stop();
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Confetti curtain */}
        {showConfetti && (
          <ConfettiCannonComponent
            fire={showConfetti}
            count={300}
            origin={{ x: width / 2, y: 0 }}
            colors={[
              "#10b981",
              "#3b82f6",
              "#f59e0b",
              "#ef4444",
              "#8b5cf6",
              "#06b6d4",
            ]}
            fadeOut={true}
            autoStart={true}
          />
        )}

        {/* Celebration content */}
        <View style={styles.celebrationContainer}>
          {/* Lottie animation */}
          <View style={styles.badgeContainer}>
            <LottieView
              ref={lottieRef}
              source={require("../../assets/lottie/perfect-day-badge.json")}
              autoPlay={false}
              loop={false}
              style={{ width: 200, height: 200 }}
            />
            <Text style={styles.badgeText}>PERFECT DAY!</Text>
          </View>

          {streakCount > 0 && (
            <Text style={styles.streakText}>{streakCount} day streak! 🔥</Text>
          )}

          <Text style={styles.celebrationText}>
            You completed all your habits today!
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  celebrationContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 24,
    margin: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  badgeContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#10b981",
    letterSpacing: 1,
  },
  streakText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f59e0b",
    marginBottom: 12,
  },
  celebrationText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
});
