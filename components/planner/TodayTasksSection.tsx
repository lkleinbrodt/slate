import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  LinearTransition,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { ActionSheetIOS, Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import React, { useEffect, useReducer, useRef, useState } from "react";
import { Radius, shadow } from "@/constants/theme";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SheetManager } from "react-native-actions-sheet";
import type { Task } from "@/components/types";
import { TaskItem } from "@/components/TaskItem";
import { ThemedText } from "@/components/themed-text";
import { formatRange, formatTime } from "@/components/TimePickerButton";
import { formatDuration, taskInterval, toHHmm, workBlock } from "@/lib/logic/schedule";
import type { DayEvent } from "@/lib/services/calendarSync";
import { useAppStore } from "@/lib/stores/appStore";
import { useCalendarStore } from "@/lib/stores/calendarStore";
import { useDaySchedule } from "@/hooks/use-day-schedule";
import { useRouter } from "expo-router";
import { useSettingsStore } from "@/lib/stores/settings";
import { useTheme } from "@/hooks/use-theme";

// A task just ticked off stays where it was tapped while the check and strike-through
// play, then sinks to the bottom in one smooth move (no spring: that jiggled every row)
const SETTLE_MS = 650;
const rowLayout = LinearTransition.duration(260);

interface TodayTasksSectionProps {
  tasks: Task[];
  onToggle: (taskId: string, completed: boolean) => void;
  onSkipForToday?: (taskId: string) => void;
  onSendToSlate?: (taskId: string) => void;
  /** A task is being held and dragged: the page should stop scrolling */
  onDragActive?: (active: boolean) => void;
}

type TimelineItem =
  | { kind: "work"; start: number; end: number }
  | { kind: "event"; start: number; end: number; event: DayEvent }
  | { kind: "task"; start: number; end: number; task: Task };

// Work and events sort before a task at the same minute
const KIND_ORDER = { work: 0, event: 1, task: 2 };

/**
 * Today's tasks. Those with a time sit on a timeline with the work block and your
 * calendar's events; the rest are below, under "No time yet", with "Fit these in".
 */
export const TodayTasksSection: React.FC<TodayTasksSectionProps> = ({
  tasks,
  onToggle,
  onSkipForToday,
  onSendToSlate,
  onDragActive,
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const { today, work, dayOff, events, now, schedule } = useDaySchedule();
  const access = useCalendarStore((s) => s.access);
  const requestAccess = useCalendarStore((s) => s.requestAccess);
  const completedCount = tasks.filter((task) => task.status === "done").length;

  const timed = tasks.filter((t) => t.startTime);
  const untimed = tasks.filter((t) => !t.startTime);

  // Done tasks that have already sunk to the bottom. One just ticked isn't here yet.
  const settled = useRef<Set<string> | null>(null);
  settled.current ??= new Set(tasks.filter((t) => t.status === "done").map((t) => t.id));
  for (const t of tasks) if (t.status !== "done") settled.current.delete(t.id);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    for (const t of tasks) {
      const ticked = t.status === "done" && !settled.current!.has(t.id);
      const timer = timers.current.get(t.id);
      if (ticked && !timer) {
        timers.current.set(
          t.id,
          setTimeout(() => {
            timers.current.delete(t.id);
            settled.current!.add(t.id);
            rerender();
          }, SETTLE_MS)
        );
      } else if (!ticked && timer) {
        clearTimeout(timer);
        timers.current.delete(t.id);
      }
    }
  }, [tasks]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // Open tasks first, settled done ones at the bottom (stable within each group)
  const sinks = (t: Task) => t.status === "done" && settled.current!.has(t.id);
  const sortedUntimed = [...untimed].sort((a, b) => Number(sinks(a)) - Number(sinks(b)));

  // The work block shows even on a day off, so the day off can be undone from it
  const block = work ?? (dayOff ? workBlock(today, schedule) : null);
  const timeline: TimelineItem[] = [
    ...(block ? [{ kind: "work" as const, ...block }] : []),
    ...events
      .filter((e) => !e.allDay)
      .map((event) => ({ kind: "event" as const, start: event.start, end: event.end, event })),
    ...timed.map((task) => ({ kind: "task" as const, ...taskInterval(task)!, task })),
  ].sort((a, b) => a.start - b.start || KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
  const allDay = events.filter((e) => e.allDay);
  // The "now" line goes before the first thing still to start
  const nowIndex = now > 0 && now < 24 * 60 ? timeline.findIndex((i) => i.start >= now) : -1;
  const canFit = untimed.some((t) => t.status === "open");

  const taskRow = (task: Task) => (
    <TaskItem
      task={task}
      isCompleted={task.status === "done"}
      onToggle={onToggle}
      onSkipForToday={onSkipForToday}
      onSendToSlate={onSendToSlate}
    />
  );

  return (
    <View>
      <SectionHeader
        title="Tasks"
        detail={tasks.length ? `${completedCount} of ${tasks.length}` : undefined}
      />

      {allDay.length > 0 && (
        <View style={styles.allDay}>
          {allDay.map((e) => (
            <View key={e.id} style={[styles.allDayChip, { borderColor: colors.borderStrong }]}>
              <View style={[styles.dot, { backgroundColor: e.color }]} />
              <ThemedText type="caption" tone="textSecondary" numberOfLines={1}>
                {e.title}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {timeline.length > 0 && (
        <View style={styles.timeline}>
          {timeline.map((item, i) => (
            <Animated.View key={itemKey(item)} layout={rowLayout}>
              {i === nowIndex && <NowLine minutes={now} />}
              <View style={styles.timelineRow}>
                <View style={styles.timeCol}>
                  <ThemedText type="captionMedium" tone="textSecondary">
                    {shortTime(item.start)}
                  </ThemedText>
                  <ThemedText type="caption" tone="textTertiary" style={styles.small}>
                    {shortTime(item.end)}
                  </ThemedText>
                </View>
                <View style={styles.flex}>
                  {item.kind === "work" && <WorkBlock dayOff={dayOff} today={today} />}
                  {item.kind === "event" && <EventBlock event={item.event} />}
                  {item.kind === "task" && (
                    <DraggableTask task={item.task} start={item.start} end={item.end} onDragActive={onDragActive}>
                      <Card padded={false} clip>
                        {taskRow(item.task)}
                      </Card>
                    </DraggableTask>
                  )}
                </View>
              </View>
            </Animated.View>
          ))}
          {nowIndex === -1 && now > 0 && now < 24 * 60 && timeline.length > 0 && (
            <NowLine minutes={now} />
          )}
        </View>
      )}

      {access === "undetermined" && (
        <Pressable
          onPress={requestAccess}
          style={[styles.access, { borderColor: colors.borderStrong }]}
          accessibilityRole="button"
        >
          <Icon name="calendarDots" size={18} color="primary" />
          <ThemedText type="callout" tone="textSecondary" style={styles.flex}>
            Show your calendar here, and put tasks with a time in it
          </ThemedText>
          <Icon name="caretRight" size={16} color="textTertiary" />
        </Pressable>
      )}

      {tasks.length === 0 ? (
        <Card variant="sunken">
          <EmptyState
            compact
            art="sunrise"
            title="A clear day"
            body="Pull something in from the Slate, or add a task with +."
            actionTitle="Open the Slate"
            actionIcon="arrowRight"
            onAction={() => router.navigate("/slate")}
          />
        </Card>
      ) : (
        untimed.length > 0 && (
          <View style={timed.length || timeline.length ? styles.untimed : undefined}>
            {timeline.length > 0 && (
              <ThemedText type="eyebrow" tone="textTertiary" style={styles.untimedLabel}>
                No time yet
              </ThemedText>
            )}
            <Card padded={false} clip>
              {sortedUntimed.map((task, i) => (
                <Animated.View key={task.id} layout={rowLayout}>
                  {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  {taskRow(task)}
                </Animated.View>
              ))}
            </Card>
            {canFit && (
              <Button
                title="Fit these in"
                icon="sparkle"
                variant="secondary"
                size="md"
                onPress={() => SheetManager.show("fit-sheet")}
                style={styles.fit}
              />
            )}
          </View>
        )
      )}
    </View>
  );
};

/** Points of movement per minute, as in the "Fit these in" timeline: 15 minutes is 21 points */
const PX = 1.4;
const SNAP = 15;
const LIFT_MS = 220;
const DAY = 24 * 60;

const hapticTick = () => {
  Haptics.selectionAsync();
};
const hapticLift = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};
const hapticDrop = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * A task with a time: hold it, then drag up or down to move it earlier or later. It
 * follows the finger, snaps to quarter hours, and a chip shows the time it would get;
 * letting go saves it and the timeline re-sorts. Open tasks only.
 */
function DraggableTask({
  task,
  start,
  end,
  onDragActive,
  children,
}: {
  task: Task;
  start: number;
  end: number;
  onDragActive?: (active: boolean) => void;
  children: React.ReactNode;
}) {
  const { colors, scheme } = useTheme();
  const updateTask = useAppStore((s) => s.updateTask);
  const length = end - start;
  const [chip, setChip] = useState<number | null>(null);

  const held = useSharedValue(false);
  const dy = useSharedValue(0);

  // Once the new time is saved the row has moved in the list: drop the finger offset
  useEffect(() => {
    dy.value = 0;
  }, [start, dy]);

  const target = useDerivedValue(() => {
    const moved = dy.value / PX;
    const snapped = Math.abs(moved) < SNAP / 2 ? start : Math.round((start + moved) / SNAP) * SNAP;
    return Math.max(0, Math.min(DAY - length, snapped));
  });

  useAnimatedReaction(
    () => (held.value ? target.value : null),
    (now, before) => {
      if (now === null) return;
      scheduleOnRN(setChip, now);
      if (before !== null && before !== undefined && now !== before) scheduleOnRN(hapticTick);
    }
  );

  const lift = () => onDragActive?.(true);
  const commit = (minute: number) => {
    setChip(null);
    onDragActive?.(false);
    if (minute !== start) updateTask(task.id, { startTime: toHHmm(minute) });
  };

  const pan = Gesture.Pan()
    .enabled(task.status === "open")
    .activateAfterLongPress(LIFT_MS)
    .onStart(() => {
      dy.value = 0;
      held.value = true;
      scheduleOnRN(lift);
      scheduleOnRN(hapticLift);
    })
    .onUpdate((e) => {
      dy.value = e.translationY;
    })
    .onFinalize(() => {
      if (!held.value) return;
      const minute = target.value;
      held.value = false;
      // Settle on the snapped spot until the saved time re-sorts the list
      if (minute === start) dy.value = withTiming(0, { duration: 140 });
      else dy.value = (minute - start) * PX;
      scheduleOnRN(commit, minute);
      scheduleOnRN(hapticDrop);
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: dy.value }, { scale: withTiming(held.value ? 1.03 : 1, { duration: 140 }) }],
    zIndex: held.value ? 20 : 0,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[style, chip !== null && shadow(scheme, 3)]}>
        {children}
        {chip !== null && (
          <View pointerEvents="none" style={[styles.chip, { backgroundColor: colors.primary }]}>
            <ThemedText type="captionMedium" style={{ color: colors.onPrimary }}>
              {formatRange(chip, chip + length)}
            </ThemedText>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

function WorkBlock({ dayOff, today }: { dayOff: boolean; today: string }) {
  const { colors, isDark } = useTheme();
  const setWorkDayOff = useSettingsStore((s) => s.setWorkDayOff);
  const openMenu = () => {
    const options = [dayOff ? "Back to work today" : "Take today off", "Cancel"];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 1,
        title: dayOff
          ? "Slate can use your work hours today."
          : "Slate never puts tasks in your work hours. You still can.",
        userInterfaceStyle: isDark ? "dark" : "light",
        tintColor: colors.primary,
      },
      (index) => {
        if (index === 0) setWorkDayOff(dayOff ? null : today);
      }
    );
  };
  return (
    <Pressable
      onPress={openMenu}
      style={[
        styles.work,
        dayOff
          ? { borderColor: colors.borderStrong, borderStyle: "dashed", borderWidth: 1 }
          : { backgroundColor: colors.surfaceSunken },
      ]}
      accessibilityRole="button"
      accessibilityHint="Mark today off work, or back on"
    >
      <Icon name="briefcase" size={18} color="textSecondary" weight="duotone" />
      <ThemedText type="bodyMedium" tone="textSecondary" style={styles.flex}>
        {dayOff ? "Day off" : "Work"}
      </ThemedText>
      <ThemedText type="caption" tone="textTertiary">
        {dayOff ? "Free to plan" : "Kept clear"}
      </ThemedText>
    </Pressable>
  );
}

/** Solid for an event that keeps you busy; dashed for one from a "Just to see" calendar,
 * which Slate plans over */
function EventBlock({ event }: { event: DayEvent }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.event,
        event.busy
          ? { borderColor: colors.borderStrong, backgroundColor: colors.surface }
          : { borderColor: colors.borderStrong, borderStyle: "dashed" },
      ]}
    >
      <View style={[styles.bar, { backgroundColor: event.color, opacity: event.busy ? 1 : 0.5 }]} />
      <View style={styles.flex}>
        <ThemedText type="callout" tone={event.busy ? "textSecondary" : "textTertiary"} numberOfLines={1}>
          {event.title}
        </ThemedText>
        <ThemedText type="caption" tone="textTertiary" numberOfLines={1}>
          {event.calendarTitle} · {formatDuration(event.end - event.start)}
          {event.busy ? "" : " · just to see"}
        </ThemedText>
      </View>
    </View>
  );
}

function NowLine({ minutes }: { minutes: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.now} accessibilityLabel={`Now, ${formatTime(toHHmm(minutes))}`}>
      <ThemedText type="eyebrow" style={[styles.nowLabel, { color: colors.primary }]}>
        {shortTime(minutes)}
      </ThemedText>
      <View style={[styles.nowDot, { backgroundColor: colors.primary }]} />
      <View style={[styles.nowLine, { backgroundColor: colors.primary }]} />
    </View>
  );
}

const itemKey = (item: TimelineItem) =>
  item.kind === "task" ? item.task.id : item.kind === "event" ? `event-${item.event.id}` : "work";

/** "3:10", "12:00", "9:00 PM" style without the suffix: the column reads top to bottom */
function shortTime(minutes: number) {
  return formatTime(toHHmm(Math.min(minutes, 24 * 60 - 1))).replace(/ (AM|PM)$/, "");
}

const styles = StyleSheet.create({
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 58 },
  flex: { flex: 1 },
  small: { fontSize: 11, lineHeight: 14 },
  allDay: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  allDayChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  timeline: { gap: 6 },
  timelineRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  timeCol: { width: 40, alignItems: "flex-end", paddingTop: 10 },
  work: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  event: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bar: { width: 3, alignSelf: "stretch", borderRadius: 2 },
  now: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  nowLabel: { width: 40, textAlign: "right", marginRight: 8 },
  nowDot: { width: 8, height: 8, borderRadius: 4, marginRight: -4, zIndex: 1 },
  nowLine: { flex: 1, height: 2 },
  access: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
  },
  untimed: { marginTop: 18 },
  untimedLabel: { marginLeft: 4, marginBottom: 8 },
  chip: {
    position: "absolute",
    right: 10,
    top: -10,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  fit: { alignSelf: "flex-start", marginTop: 10 },
});
