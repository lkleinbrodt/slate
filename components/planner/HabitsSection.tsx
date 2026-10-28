import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { StyleSheet, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { HabitItem } from "@/components/HabitItem";
import { Illustration } from "@/components/ui/Illustration";
import React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SheetManager } from "react-native-actions-sheet";
import { ThemedText } from "@/components/themed-text";
import type { Habit } from "@/components/types";

interface HabitsSectionProps {
  habits: Habit[];
  completedHabits: Habit[];
  habitStreaks: Record<string, number>;
  onToggle: (habitId: string) => void;
}

export const HabitsSection: React.FC<HabitsSectionProps> = ({
  habits,
  completedHabits,
  habitStreaks,
  onToggle,
}) => {
  const completedIds = new Set(completedHabits.map((h) => h.id));
  const isPerfect = habits.length > 0 && completedIds.size === habits.length;

  // Pair habits into rows of two for the grid
  const rows: Habit[][] = [];
  for (let i = 0; i < habits.length; i += 2) rows.push(habits.slice(i, i + 2));

  return (
    <View>
      <SectionHeader
        title="Habits"
        detail={habits.length ? `${completedIds.size} of ${habits.length}` : undefined}
      />

      {habits.length === 0 ? (
        <Card variant="sunken">
          <EmptyState
            compact
            art="stones"
            title="No habits yet"
            body="Small things, done every day. Streaks start the first time you check one off."
            actionTitle="Add a habit"
            onAction={() =>
              SheetManager.show("add-edit-modal", {
                payload: { mode: "add", type: "habit" },
              })
            }
          />
        </Card>
      ) : (
        <View style={styles.grid}>
          {isPerfect && (
            <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)}>
              <Card style={styles.perfect} elevation={2}>
                <Illustration name="sunrise" size={56} />
                <View style={styles.perfectText}>
                  <ThemedText type="heading">A perfect day</ThemedText>
                  <ThemedText type="callout" tone="textSecondary">
                    Every habit done. Your streaks are safe.
                  </ThemedText>
                </View>
              </Card>
            </Animated.View>
          )}
          {rows.map((row) => (
            <Animated.View
              key={row.map((h) => h.id).join("|")}
              layout={LinearTransition}
              style={styles.row}
            >
              {row.map((habit) => (
                <HabitItem
                  key={habit.id}
                  habit={habit}
                  isCompleted={completedIds.has(habit.id)}
                  streak={habitStreaks[habit.id] || 0}
                  onToggle={onToggle}
                />
              ))}
              {row.length === 1 && <View style={styles.spacer} />}
            </Animated.View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: { gap: 12 },
  row: { flexDirection: "row", gap: 12 },
  spacer: { flexGrow: 1, flexBasis: 0 },
  perfect: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  perfectText: { flex: 1, gap: 2 },
});
