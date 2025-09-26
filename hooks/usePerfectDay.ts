/**
 * Custom hook for managing Perfect Day detection and celebration
 */

import * as Haptics from "expo-haptics";

import { useCallback, useState } from "react";

interface UsePerfectDayProps {
  currentDayPlan: {
    habits: any[];
    completedHabits: any[];
  } | null;
  completeHabit: (habitId: string, date: string) => Promise<void>;
  localToday: (dayStart: string) => string;
  dayStart: string;
}

export function usePerfectDay({
  currentDayPlan,
  completeHabit,
  localToday,
  dayStart,
}: UsePerfectDayProps) {
  const [showPerfectDay, setShowPerfectDay] = useState(false);

  const handleCompleteHabit = useCallback(
    async (habitId: string) => {
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Check if this completion will trigger a Perfect Day
      const isAlreadyCompleted = currentDayPlan?.completedHabits.some(
        (h) => h.id === habitId
      );
      const willBePerfectDay =
        !isAlreadyCompleted &&
        currentDayPlan &&
        currentDayPlan.habits.length > 0 &&
        currentDayPlan.completedHabits.length + 1 ===
          currentDayPlan.habits.length;

      const today = localToday(dayStart);
      await completeHabit(habitId, today);

      if (willBePerfectDay) {
        setShowPerfectDay(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    [completeHabit, localToday, dayStart, currentDayPlan]
  );

  return {
    showPerfectDay,
    setShowPerfectDay,
    handleCompleteHabit,
  };
}
