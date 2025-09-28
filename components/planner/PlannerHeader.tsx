import { ProgressTracker } from "@/components/ProgressTracker";
import React from "react";
import { TabHeader } from "@/components/shared/TabHeader";
import { View } from "react-native";

interface PlannerHeaderProps {
  completedTasksCount: number;
  totalTasksCount: number;
  completedHabitsCount: number;
  totalHabitsCount: number;
}

export const PlannerHeader: React.FC<PlannerHeaderProps> = ({
  completedTasksCount,
  totalTasksCount,
  completedHabitsCount,
  totalHabitsCount,
}) => {
  const taskProgress =
    totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;
  const habitProgress =
    totalHabitsCount > 0 ? (completedHabitsCount / totalHabitsCount) * 100 : 0;

  return (
    <TabHeader title="Today">
      <View style={styles.progressTrackers}>
        <ProgressTracker
          label="Tasks"
          completed={completedTasksCount}
          total={totalTasksCount}
          progress={taskProgress}
        />
        <ProgressTracker
          label="Habits"
          completed={completedHabitsCount}
          total={totalHabitsCount}
          progress={habitProgress}
        />
      </View>
    </TabHeader>
  );
};

const styles = {
  progressTrackers: {
    flexDirection: "row" as const,
    gap: 20,
  },
};
