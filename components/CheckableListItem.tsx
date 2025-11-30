import { LevelUpAnimation, TapWin } from "./celebration";
import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { UI } from "@/lib/constants/app";
import { useThemeColor } from "@/hooks/use-theme-color";

interface CheckableListItemProps {
  isCompleted: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const CheckableListItem: React.FC<CheckableListItemProps> = ({
  isCompleted,
  onToggle,
  children,
}) => {
  const [triggerLevelUp, setTriggerLevelUp] = useState(false);
  const [isVisuallyCompleted, setIsVisuallyCompleted] = useState(isCompleted);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const primaryColor = useThemeColor({}, "primary");
  const borderColor = useThemeColor({}, "border");

  const handleLevelUp = () => setTriggerLevelUp(true);
  const handleLevelUpComplete = () => setTriggerLevelUp(false);

  // Sync visual state when prop changes
  useEffect(() => {
    setIsVisuallyCompleted(isCompleted);
  }, [isCompleted]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleToggle = () => {
    if (!isCompleted) {
      // Immediately update visual state to show checked appearance
      setIsVisuallyCompleted(true);
      handleLevelUp(); // Trigger level up only on completion
      // Call onToggle immediately - no delay to prevent race conditions
      onToggle();
    } else {
      // Clear any pending timeout when unchecking
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsVisuallyCompleted(false);
      onToggle();
    }
  };

  return (
    <LevelUpAnimation
      trigger={triggerLevelUp}
      onComplete={handleLevelUpComplete}
    >
      <View style={[styles.container, { borderBottomColor: borderColor }]}>
        <TapWin
          checked={isVisuallyCompleted}
          onPress={handleToggle}
          size={32}
          color={primaryColor}
        />
        <View style={styles.content}>{children}</View>
      </View>
    </LevelUpAnimation>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: UI.SPACING.SM,
    paddingHorizontal: UI.SPACING.SM,
    minHeight: UI.MIN_TOUCH_TARGET_SIZE,
    gap: UI.SPACING.SM,
  },
  content: {
    flex: 1,
  },
});
