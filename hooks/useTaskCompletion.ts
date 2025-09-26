/**
 * Custom hook for managing task completion with haptic feedback
 */

import * as Haptics from "expo-haptics";

import { useCallback } from "react";

interface UseTaskCompletionProps {
  completeTask: (taskId: string, completed: boolean) => Promise<void>;
}

export function useTaskCompletion({ completeTask }: UseTaskCompletionProps) {
  const handleCompleteTask = useCallback(
    async (taskId: string, completed: boolean) => {
      // Haptic feedback
      if (completed) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      await completeTask(taskId, completed);
    },
    [completeTask]
  );

  return {
    handleCompleteTask,
  };
}
