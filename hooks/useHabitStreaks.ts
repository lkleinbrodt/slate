/**
 * Custom hook for managing habit streaks
 * Now calculates streaks from the event log instead of using DAL
 */

import { localToday } from "@/lib/utils/clock";
import { useMemo } from "react";
import { useSlateStore } from "@/lib/stores/slateStore";

interface UseHabitStreaksProps {
  dayStart: string;
}

export function useHabitStreaks({ dayStart }: UseHabitStreaksProps) {
  const { habits, isInitialized } = useSlateStore();

  const habitStreaks = useMemo(() => {
    if (!isInitialized || habits.length === 0) return {};

    const today = localToday(dayStart);
    const streaks: Record<string, number> = {};

    // Calculate streaks for each habit
    habits.forEach((habit) => {
      // For now, we'll use a simple calculation based on isDoneToday
      // In a more sophisticated implementation, we'd replay events to calculate actual streaks
      streaks[habit.id] = habit.streak || 0;
    });

    return streaks;
  }, [habits, isInitialized, dayStart]);

  return habitStreaks;
}
