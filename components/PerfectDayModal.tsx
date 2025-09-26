import { PerfectDayCelebration } from "./celebration";
import { PerfectDayModalProps } from "./types";
import React from "react";

export const PerfectDayModal: React.FC<PerfectDayModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <PerfectDayCelebration
      visible={visible}
      onClose={onClose}
      streakCount={0} // We can enhance this later to show actual streak
    />
  );
};
