import { LevelUpAnimation, TapWin } from "./celebration";
import React, { useState } from "react";
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
  const primaryColor = useThemeColor({}, "primary");
  const borderColor = useThemeColor({}, "border");

  const handleLevelUp = () => setTriggerLevelUp(true);
  const handleLevelUpComplete = () => setTriggerLevelUp(false);

  const handleToggle = () => {
    if (!isCompleted) {
      handleLevelUp(); // Trigger level up only on completion
    }
    onToggle();
  };

  return (
    <LevelUpAnimation
      trigger={triggerLevelUp}
      onComplete={handleLevelUpComplete}
    >
      <View style={[styles.container, { borderBottomColor: borderColor }]}>
        <TapWin
          checked={isCompleted}
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
