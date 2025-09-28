import { StyleSheet, View } from "react-native";

import { ProgressTracker } from "@/components/ProgressTracker";
import { TabHeader } from "@/components/shared/TabHeader";
import React from "react";

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

const styles = StyleSheet.create({
  progressTrackers: {
    flexDirection: "row",
    gap: 20,
  },
});
