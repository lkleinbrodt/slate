import { Pressable, StyleSheet, View } from "react-native";
import React, { useMemo, useState } from "react";
import { parseRule, ruleLabel } from "@/lib/logic/repeat";

import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { SheetManager } from "react-native-actions-sheet";
import { Task } from "@/components/types";
import { ThemedText } from "@/components/themed-text";
import { dueLabel } from "@/components/TaskItem";
import { useTheme } from "@/hooks/use-theme";
import { useTimeStore } from "@/lib/stores/timeStore";

interface RecurringSectionProps {
  /** Every open task; the repeating ones are picked out here */
  tasks: Task[];
}

/**
 * Where repeating tasks are viewed and managed. Each series has exactly one open
 * instance, so listing those lists the series. Tapping one opens the edit sheet
 * (change the rule, or delete to end the series). Collapsed by default.
 */
export const RecurringSection: React.FC<RecurringSectionProps> = ({ tasks }) => {
  const { colors } = useTheme();
  const today = useTimeStore((s) => s.currentDate);
  const [expanded, setExpanded] = useState(false);

  const series = useMemo(
    () =>
      tasks
        .filter((t) => parseRule(t.repeatRule))
        .sort(
          (a, b) =>
            (a.dueDate ?? a.scheduledFor ?? "").localeCompare(
              b.dueDate ?? b.scheduledFor ?? ""
            ) || a.title.localeCompare(b.title)
        ),
    [tasks]
  );

  if (series.length === 0) return null;

  return (
    <View>
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`Recurring tasks, ${series.length}`}
      >
        <ThemedText type="eyebrow" tone="textSecondary">
          Recurring tasks
        </ThemedText>
        <View style={styles.right}>
          <ThemedText type="captionMedium" tone="textTertiary">
            {series.length}
          </ThemedText>
          <View style={expanded ? undefined : styles.collapsedCaret}>
            <Icon name="caretDown" size={14} color="textTertiary" weight="bold" />
          </View>
        </View>
      </Pressable>

      {expanded && (
        <Card padded={false} clip>
          {series.map((task, i) => {
            const rule = parseRule(task.repeatRule)!;
            const next = task.dueDate ?? task.scheduledFor;
            const isOverdue = !!next && next < today;
            return (
              <View key={task.id}>
                {i > 0 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
                <Pressable
                  onPress={() =>
                    SheetManager.show("add-edit-modal", {
                      payload: { mode: "edit", type: "task", itemId: task.id },
                    })
                  }
                  style={styles.row}
                  accessibilityRole="button"
                >
                  <ThemedText type="bodyMedium">{task.title}</ThemedText>
                  <View style={styles.meta}>
                    <Chip icon="repeat" tone="habit" label={ruleLabel(rule)} />
                    {next && (
                      <Chip
                        icon="flag"
                        tone={isOverdue ? "error" : "streak"}
                        label={dueLabel(next, today, isOverdue).replace(/^Due/, "Next")}
                      />
                    )}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginBottom: 4,
  },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
  collapsedCaret: { transform: [{ rotate: "-90deg" }] },
  row: { paddingVertical: 14, paddingHorizontal: 16, gap: 6, minHeight: 60 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
});
