import { StyleSheet, View } from "react-native";

import { ProgressRing } from "@/components/ui/ProgressRing";
import React from "react";
import { ThemedText } from "@/components/themed-text";
import { fromLocalDate } from "@/lib/logic/dates";
import { useTheme } from "@/hooks/use-theme";
import { useTimeStore } from "@/lib/stores/timeStore";

interface PlannerHeaderProps {
  completedTasksCount: number;
  totalTasksCount: number;
  completedHabitsCount: number;
  totalHabitsCount: number;
}

function greeting(hour: number) {
  if (hour < 4) return "Still up?";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export const PlannerHeader: React.FC<PlannerHeaderProps> = ({
  completedTasksCount,
  totalTasksCount,
  completedHabitsCount,
  totalHabitsCount,
}) => {
  const { colors } = useTheme();
  const today = useTimeStore((s) => s.currentDate);
  const day = fromLocalDate(today);
  const total = totalTasksCount + totalHabitsCount;
  const done = completedTasksCount + completedHabitsCount;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const tasksLeft = totalTasksCount - completedTasksCount;

  const summary =
    total === 0
      ? "A blank slate"
      : done === total
      ? "All done for today"
      : tasksLeft > 0
      ? `${tasksLeft} task${tasksLeft === 1 ? "" : "s"} to go`
      : "Just habits left";

  return (
    <View style={styles.header}>
      <View style={styles.text}>
        <ThemedText type="greeting" tone="textSecondary">
          {greeting(new Date().getHours())},
        </ThemedText>
        <ThemedText type="display">{day.format("dddd")}</ThemedText>
        <ThemedText type="eyebrow" tone="textTertiary" style={styles.date}>
          {day.format("MMMM D")} · {summary}
        </ThemedText>
      </View>

      {/* Outer ring: tasks. Inner ring: habits. */}
      <ProgressRing
        size={84}
        strokeWidth={8}
        progress={totalTasksCount ? completedTasksCount / totalTasksCount : 0}
        color={colors.primary}
      >
        <ProgressRing
          size={62}
          strokeWidth={8}
          progress={totalHabitsCount ? completedHabitsCount / totalHabitsCount : 0}
          color={colors.habit}
        >
          <ThemedText type="captionMedium" style={styles.percent}>
            {percent}%
          </ThemedText>
        </ProgressRing>
      </ProgressRing>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 16,
  },
  text: { flex: 1 },
  date: { marginTop: 6 },
  percent: { fontVariant: ["tabular-nums"] },
});
