import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SheetManager, SheetProps } from "react-native-actions-sheet";

import { Button } from "@/components/ui/Button";
import { Sheet, SheetHeader } from "@/components/ui/Sheet";
import { ThemedText } from "@/components/themed-text";
import { formatTime } from "@/components/TimePickerButton";
import {
  DEFAULT_DURATION,
  type PlacedSlot,
  planOrder,
  planTasks,
  reflowPlan,
  taskInterval,
  toHHmm,
} from "@/lib/logic/schedule";
import { Radius } from "@/constants/theme";
import { useAppStore } from "@/lib/stores/appStore";
import { useDaySchedule } from "@/hooks/use-day-schedule";
import { useTheme } from "@/hooks/use-theme";
import { type FixedBlock, PlanTimeline } from "./PlanTimeline";

/**
 * Places every task without a time into today's free gaps, for review. Hold and drag a
 * task to move it; the others are pushed out of its way (reflowPlan).
 */
export default function FitSheet({ sheetId }: SheetProps<"fit-sheet">) {
  const { colors } = useTheme();
  const todayTasks = useAppStore((s) => s.todayTasks);
  const applySlots = useAppStore((s) => s.applySlots);
  const { schedule, events, work, now, gapsFor } = useDaySchedule();
  // Tasks taken out of this plan with ✕ (they stay without a time)
  const [dropped, setDropped] = useState<string[]>([]);
  // Once a task has been moved by hand the plan stops re-planning itself
  const [arranged, setArranged] = useState<PlacedSlot[] | null>(null);
  // The task being dragged and where it is right now
  const [preview, setPreview] = useState<{ id: string; start: number } | null>(null);

  const candidates = todayTasks
    .filter((t) => t.status === "open" && !t.startTime && !dropped.includes(t.id))
    .sort(planOrder);
  // Free time around events, work and tasks that already have a time
  const gaps = gapsFor();
  const base =
    arranged ??
    planTasks(
      candidates.map((t) => ({ id: t.id, duration: t.durationMin ?? DEFAULT_DURATION })),
      gaps
    );
  const plan = preview ? reflowPlan(base, preview.id, preview.start, gaps).placed : base;
  const placed = new Set(plan.map((p) => p.id));
  const leftOver = candidates.filter((t) => !placed.has(t.id));
  const title = (id: string) => candidates.find((t) => t.id === id)?.title ?? "";

  // What's already fixed for the rest of the day, for context
  const fixed: FixedBlock[] = [
    ...(work && work.end > now ? [{ kind: "work" as const, id: "work", title: "Work", ...work }] : []),
    ...events
      .filter((e) => !e.allDay && e.end > now)
      .map((e) => ({ kind: "event" as const, id: e.id, title: e.title, start: e.start, end: e.end, color: e.color })),
    ...todayTasks.flatMap((t) => {
      const slot = taskInterval(t);
      return slot && t.status === "open" && slot.end > now
        ? [{ kind: "task" as const, id: t.id, title: t.title, ...slot }]
        : [];
    }),
  ];

  const drop = (id: string, start: number) => {
    setPreview(null);
    setArranged(reflowPlan(base, id, start, gaps).placed);
  };

  const remove = (id: string) => {
    setDropped((d) => [...d, id]);
    setArranged((a) => a && a.filter((p) => p.id !== id));
  };

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
            work and your calendar. Hold a task and drag it to move it.
          </ThemedText>
        </View>
      </View>

      {plan.length > 0 && (
        <PlanTimeline
          fixed={fixed}
          plan={plan.map((p) => ({ ...p, title: title(p.id) }))}
          now={now}
          onPreview={(id, start) => setPreview(start === null ? null : { id, start })}
          onDrop={drop}
          onRemove={remove}
        />
      )}

      <View style={[styles.content, styles.footer]}>
        {!plan.length && (
          <ThemedText type="callout" tone="textSecondary" style={styles.center}>
            {candidates.length
              ? "None of these fit in the time left today."
              : "Every task for today already has a time."}
          </ThemedText>
        )}
        {plan.length > 0 && leftOver.length > 0 && (
          <ThemedText type="caption" tone="textTertiary" style={styles.center}>
            {"Doesn't fit today: "}
            {leftOver.map((t) => t.title).join(", ")}
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
  footer: { paddingTop: 14 },
  note: { borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  center: { textAlign: "center" },
});
