import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SheetManager, SheetProps } from "react-native-actions-sheet";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Sheet, SheetHeader } from "@/components/ui/Sheet";
import { ThemedText } from "@/components/themed-text";
import { formatTime } from "@/components/TimePickerButton";
import {
  DEFAULT_DURATION,
  formatDuration,
  planOrder,
  planTasks,
  taskInterval,
  toHHmm,
} from "@/lib/logic/schedule";
import { Radius } from "@/constants/theme";
import { useAppStore } from "@/lib/stores/appStore";
import { useDaySchedule } from "@/hooks/use-day-schedule";
import { useTheme } from "@/hooks/use-theme";
import { formatRange } from "./ScheduleOptions";

type Row =
  | { kind: "new"; id: string; title: string; start: number; end: number }
  | { kind: "fixed"; id: string; title: string; start: number; end: number };

/** Places every task without a time into today's free gaps, for review */
export default function FitSheet({ sheetId }: SheetProps<"fit-sheet">) {
  const { colors } = useTheme();
  const todayTasks = useAppStore((s) => s.todayTasks);
  const applySlots = useAppStore((s) => s.applySlots);
  const { schedule, events, now, gapsFor } = useDaySchedule();
  // Tasks taken out of this plan with ✕ (they stay without a time)
  const [dropped, setDropped] = useState<string[]>([]);

  const candidates = todayTasks
    .filter((t) => t.status === "open" && !t.startTime && !dropped.includes(t.id))
    .sort(planOrder);
  const plan = planTasks(
    candidates.map((t) => ({ id: t.id, duration: t.durationMin ?? DEFAULT_DURATION })),
    gapsFor()
  );
  const placed = new Set(plan.map((p) => p.id));
  const leftOver = candidates.filter((t) => !placed.has(t.id));

  // What's already fixed for the rest of the day, for context
  const rows: Row[] = [
    ...events
      .filter((e) => !e.allDay && e.end > now)
      .map((e) => ({ kind: "fixed" as const, id: e.id, title: e.title, start: e.start, end: e.end })),
    ...todayTasks.flatMap((t) => {
      const slot = taskInterval(t);
      return slot && t.status === "open" && slot.end > now
        ? [{ kind: "fixed" as const, id: t.id, title: t.title, ...slot }]
        : [];
    }),
    ...plan.map((p) => ({
      kind: "new" as const,
      id: p.id,
      title: candidates.find((t) => t.id === p.id)!.title,
      start: p.start,
      end: p.end,
    })),
  ].sort((a, b) => a.start - b.start);

  const apply = async () => {
    await applySlots(
      plan.map((p) => ({ taskId: p.id, startTime: toHHmm(p.start), durationMin: p.end - p.start }))
    );
    SheetManager.hide(sheetId);
  };

  return (
    <Sheet id={sheetId}>
      <SheetHeader sheetId={sheetId} eyebrow="Fit these in" title="Plan the rest of today" />
      <View style={styles.content}>
        <View style={[styles.note, { backgroundColor: colors.surfaceSunken }]}>
          <ThemedText type="caption" tone="textSecondary">
            Between {formatTime(schedule.windowStart)} and {formatTime(schedule.windowEnd)}, around
            work and your calendar. Your events stay where they are.
          </ThemedText>
        </View>

        <View style={styles.rows}>
          {rows.map((row) => (
            <View key={`${row.kind}-${row.id}`} style={styles.row}>
              <ThemedText type="captionMedium" tone="textSecondary" style={styles.time}>
                {formatTime(toHHmm(row.start)).replace(" ", " ")}
              </ThemedText>
              <View
                style={[
                  styles.block,
                  row.kind === "new"
                    ? { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderStyle: "dashed" }
                    : { borderColor: colors.border },
                ]}
              >
                <View style={styles.flex}>
                  <ThemedText
                    type={row.kind === "new" ? "bodyMedium" : "callout"}
                    tone={row.kind === "new" ? "text" : "textSecondary"}
                    numberOfLines={1}
                  >
                    {row.title}
                  </ThemedText>
                  {row.kind === "new" && (
                    <ThemedText type="caption" style={{ color: colors.primary }}>
                      {formatRange(row.start, row.end)} · {formatDuration(row.end - row.start)}
                    </ThemedText>
                  )}
                </View>
                {row.kind === "new" && (
                  <Pressable
                    onPress={() => setDropped((d) => [...d, row.id])}
                    hitSlop={10}
                    accessibilityLabel={`Leave ${row.title} without a time`}
                  >
                    <Icon name="x" size={16} color="textTertiary" weight="bold" />
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>

        {!plan.length && (
          <ThemedText type="callout" tone="textSecondary" style={styles.center}>
            {candidates.length
              ? "None of these fit in the time left today."
              : "Every task for today already has a time."}
          </ThemedText>
        )}
        {plan.length > 0 && leftOver.length > 0 && (
          <ThemedText type="caption" tone="textTertiary" style={styles.center}>
            {"Doesn't fit today: "}{leftOver.map((t) => t.title).join(", ")}
          </ThemedText>
        )}

        <Button
          title={plan.length ? `Schedule ${plan.length}` : "Done"}
          icon={plan.length ? "calendarCheck" : "check"}
          onPress={plan.length ? apply : () => SheetManager.hide(sheetId)}
          haptics="medium"
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 14 },
  note: { borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  rows: { gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  time: { width: 64, textAlign: "right" },
  block: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  flex: { flex: 1 },
  center: { textAlign: "center" },
});
