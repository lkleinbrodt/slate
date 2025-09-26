import { LevelUpAnimation, TapWin } from "./celebration";
import React, { useState } from "react";

import { View } from "react-native";
import { listItemStyles } from "@/lib/utils/styles";
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
  const primaryColor = useThemeColor({}, "tint");

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
      <View style={listItemStyles.container}>
        <TapWin
          checked={isCompleted}
          onPress={handleToggle}
          size={28}
          color={primaryColor}
        />
        {children}
      </View>
    </LevelUpAnimation>
  );
};
