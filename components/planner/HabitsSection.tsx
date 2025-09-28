import { HabitItem } from "@/components/HabitItem";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { SectionContainer } from "@/components/planner/SectionContainer";
import { StyleSheet } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { UI } from "@/lib/constants/app";
import { useThemeColor } from "@/hooks/use-theme-color";

interface HabitsSectionProps {
  habits: any[];
  completedHabits: any[];
  habitStreaks: Record<string, number>;
  onToggle: (habitId: string) => void;
}

export const HabitsSection: React.FC<HabitsSectionProps> = ({
  habits,
  completedHabits,
  habitStreaks,
  onToggle,
}) => {
  const backgroundColor = useThemeColor({}, "backgroundSecondary");
  const secondaryColor = useThemeColor({}, "secondary");
  const secondaryColorDark = useThemeColor({}, "secondaryDark");
  const secondaryColorLight = useThemeColor({}, "secondaryLight");
  const textTertiaryColor = useThemeColor({}, "textTertiary");
  const completedCount = completedHabits.length;
  const totalCount = habits.length;

  return (
    <SectionContainer
      title="Habits"
      subtitle={`${completedCount}/${totalCount}`}
      backgroundColor={secondaryColorLight}
      titleColor={secondaryColorDark}
      borderColor={secondaryColor}
    >
      {habits.length > 0 ? (
        <>
          {habits.map((habit) => {
            const isCompleted = completedHabits.some((h) => h.id === habit.id);
            const streak = habitStreaks[habit.id] || 0;
            return (
              <HabitItem
                key={habit.id}
                habit={habit}
                isCompleted={isCompleted}
                streak={streak}
                onToggle={onToggle}
              />
            );
          })}
        </>
      ) : (
        <ThemedView style={[styles.emptySubsection, { backgroundColor }]}>
          <Ionicons
            name="refresh-outline"
            size={32}
            color={textTertiaryColor}
          />
          <ThemedText type="body" style={styles.emptySubsectionText}>
            No habits yet
          </ThemedText>
          <ThemedText type="caption" style={styles.emptySubsectionSubtext}>
            Create your first habit to build consistency!
          </ThemedText>
        </ThemedView>
      )}
    </SectionContainer>
  );
};

const styles = StyleSheet.create({
  emptySubsection: {
    padding: UI.SPACING.XXL,
    alignItems: "center",
    borderRadius: UI.BORDER_RADIUS.MD,
    marginVertical: UI.SPACING.SM,
    gap: UI.SPACING.SM,
  },
  emptySubsectionText: {
    textAlign: "center",
    opacity: 0.8,
  },
  emptySubsectionSubtext: {
    textAlign: "center",
    opacity: 0.6,
  },
});
