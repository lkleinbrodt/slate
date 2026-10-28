import { ScrollView, StyleSheet, View } from "react-native";
import { Sheet, SheetHeader } from "@/components/ui/Sheet";

import { Icon } from "@/components/ui/Icon";
import { Illustration } from "@/components/ui/Illustration";
import { Radius } from "@/constants/theme";
import React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SheetProps } from "react-native-actions-sheet";
import { ThemedText } from "@/components/themed-text";
import { fromLocalDate } from "@/lib/logic/dates";
import { useTheme } from "@/hooks/use-theme";

type DayDetailsModalProps = SheetProps<"day-details-sheet">;

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  sheetId,
  payload,
}) => {
  const { colors } = useTheme();
  const { snapshot } = payload || {};

  if (!snapshot) return null;

  const habits = snapshot.habits.map((h: any) => ({
    id: h.habit_history.id as string,
    title: h.habits?.title as string,
    done: !!h.habit_history.completed,
  }));
  const tasks = snapshot.tasks.map((t: any) => ({
    id: t.task_history.id as string,
    title: t.tasks?.title as string,
    done: !!t.task_history.completed,
  }));
  const habitsDone = habits.filter((h) => h.done).length;
  const tasksDone = tasks.filter((t) => t.done).length;
  const day = fromLocalDate(snapshot.date);

  return (
    <Sheet id={sheetId}>
      <SheetHeader sheetId={sheetId} eyebrow={day.format("dddd")} title={day.format("MMMM D")} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {snapshot.isPerfectDay && (
          <View style={[styles.perfect, { backgroundColor: colors.habitSoft }]}>
            <Illustration name="sunrise" size={44} />
            <View style={styles.flex}>
              <ThemedText type="heading" style={{ color: colors.habit }}>
                A perfect day
              </ThemedText>
              <ThemedText type="caption" tone="textSecondary">
                Every habit, done.
              </ThemedText>
            </View>
          </View>
        )}

        <View>
          <SectionHeader
            title="Habits"
            detail={habits.length ? `${habitsDone} of ${habits.length}` : undefined}
          />
          {habits.length === 0 ? (
            <ThemedText type="callout" tone="textTertiary" style={styles.none}>
              No habits that day.
            </ThemedText>
          ) : (
            habits.map((h) => <Row key={h.id} title={h.title} done={h.done} color={colors.habit} />)
          )}
        </View>

        <View>
          <SectionHeader
            title="Tasks"
            detail={tasks.length ? `${tasksDone} of ${tasks.length}` : undefined}
          />
          {tasks.length === 0 ? (
            <ThemedText type="callout" tone="textTertiary" style={styles.none}>
              Nothing planned.
            </ThemedText>
          ) : (
            tasks.map((t) => <Row key={t.id} title={t.title} done={t.done} color={colors.primary} />)
          )}
        </View>
      </ScrollView>
    </Sheet>
  );
};

function Row({ title, done, color }: { title: string; done: boolean; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.dot,
          done
            ? { backgroundColor: color, borderColor: color }
            : { backgroundColor: colors.surfaceSunken, borderColor: colors.borderStrong },
        ]}
      >
        {done && <Icon name="check" size={12} color={colors.onPrimary} weight="bold" />}
      </View>
      <ThemedText
        type="body"
        tone={done ? "text" : "textTertiary"}
        style={styles.flex}
      >
        {title}
      </ThemedText>
      {!done && (
        <ThemedText type="caption" tone="textTertiary">
          Missed
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 520 },
  content: { paddingHorizontal: 20, gap: 20, paddingBottom: 8 },
  perfect: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: Radius.lg,
  },
  flex: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  none: { paddingHorizontal: 4 },
});
