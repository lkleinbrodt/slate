import * as Haptics from "expo-haptics";
import Animated, {
  type AnimatedRef,
  LinearTransition,
  type SharedValue,
  measure,
  scrollTo,
  useAnimatedRef,
  useAnimatedStyle,
  useFrameCallback,
  useScrollOffset,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ActionSheetIOS, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTabBarSpace } from "@/components/TabBar";

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
import { type FixedBlock, type PlanBlock, PlanTimeline } from "@/components/schedule/PlanTimeline";
import { DEFAULT_DURATION, taskInterval, toHHmm, toMinutes, workBlock } from "@/lib/logic/schedule";
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
/** Hold this long before a task without a time lifts, so a quick swipe still scrolls */
const LIFT_MS = 220;
/** Finger this close to the top of the screen or the tab bar scrolls the page */
const PAGE_EDGE = 90;
/** The tab bar space includes this much breathing room above the bar itself */
const BAR_GAP = 24;
const PAGE_SPEED = 10;

interface TodayTasksSectionProps {
  tasks: Task[];
  onToggle: (taskId: string, completed: boolean) => void;
  onSkipForToday?: (taskId: string) => void;
  onSendToSlate?: (taskId: string) => void;
  /** A task is being held and dragged: the page should stop scrolling */
  onDragActive?: (active: boolean) => void;
  /** The page's scroll view and how far it scrolls: dragging a task near the screen's
   * edge scrolls it, to reach the calendar */
  page?: { ref: AnimatedRef<Animated.ScrollView>; max: SharedValue<number> };
}

/**
 * Today's tasks. Those without a time come first, with "Fit these in". Below them, those
 * with a time sit on a calendar of their own, with the work block and your calendar's
 * events: hold one and drag it to move it; the calendar scrolls at its edges. Hold a
 * task without a time and drag it onto the calendar to give it one.
 */
export const TodayTasksSection: React.FC<TodayTasksSectionProps> = ({
  tasks,
  onToggle,
  onSkipForToday,
  onSendToSlate,
  onDragActive,
  page,
}) => {
  const { colors, isDark, scheme } = useTheme();
  const updateTask = useAppStore((s) => s.updateTask);
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  // The floating tab bar covers the bottom of the screen
  const obscured = { top: insets.top, bottom: useTabBarSpace() - BAR_GAP };

  // Dragging a task without a time onto the calendar. The row stays put; a copy follows
  // the finger until it's over the calendar, which then shows where it would land.
  const [carried, setCarried] = useState<Task | null>(null);
  const fingerY = useSharedValue(-1);
  const dropAt = useSharedValue(-1);
  const sectionRef = useAnimatedRef<Animated.View>();
  const sectionTop = useSharedValue(0);
  const noPage = useAnimatedRef<Animated.ScrollView>();
  const pageRef = page?.ref ?? noPage;
  const pageY = useScrollOffset(pageRef);
  const zones = useSharedValue({ top: 0, bottom: 0 });
  // A drag that starts near an edge doesn't scroll the page until the finger has been
  // in the middle once
  const armed = useSharedValue(false);
  useEffect(() => {
    zones.value = { top: obscured.top + PAGE_EDGE, bottom: screenHeight - obscured.bottom - PAGE_EDGE };
  }, [obscured.top, obscured.bottom, screenHeight, zones]);

  // Only runs while a task is carried, so the idle screen doesn't wake the UI thread
  const frame = useFrameCallback(() => {
    const y = fingerY.value;
    if (y < 0) return;
    const box = measure(sectionRef);
    if (box) sectionTop.value = box.pageY;
    // Over the calendar, it scrolls itself; elsewhere near an edge, the page scrolls
    if (!page || dropAt.value >= 0) return;
    const { top, bottom } = zones.value;
    if (y >= top && y <= bottom) armed.value = true;
    if (!armed.value) return;
    let speed = 0;
    if (y > bottom) speed = Math.min(1, (y - bottom) / PAGE_EDGE) * PAGE_SPEED;
    else if (y < top) speed = -Math.min(1, (top - y) / PAGE_EDGE) * PAGE_SPEED;
    if (!speed) return;
    const next = Math.max(0, Math.min(page.max.value, pageY.value + speed));
    if (next !== pageY.value) scrollTo(pageRef, 0, next, false);
  }, false);

  const ghostStyle = useAnimatedStyle(() => ({
    top: fingerY.value - sectionTop.value - 26,
    opacity: withTiming(fingerY.value >= 0 && dropAt.value < 0 ? 1 : 0, { duration: 120 }),
  }));

  const lift = (task: Task) => {
    armed.value = false;
    frame.setActive(true);
    setCarried(task);
    onDragActive?.(true);
  };
  const land = (id: string, minute: number) => {
    frame.setActive(false);
    setCarried(null);
    onDragActive?.(false);
    if (minute >= 0) updateTask(id, { startTime: toHHmm(minute) });
  };
  const setWorkDayOff = useSettingsStore((s) => s.setWorkDayOff);
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

  const block = work ?? (dayOff ? workBlock(today, schedule) : null);
  const fixed: FixedBlock[] = [
    ...(block
      ? [{ kind: "work" as const, id: "work", title: dayOff ? "Day off" : "Work", free: dayOff, ...block }]
      : []),
    ...events
      .filter((e) => !e.allDay)
      .map((e) => ({
        kind: "event" as const,
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        color: e.color,
        free: !e.busy,
      })),
  ];
  const plan: PlanBlock[] = timed.map((t) => ({
    id: t.id,
    title: t.title,
    done: t.status === "done",
    ...taskInterval(t)!,
  }));
  const canFit = untimed.some((t) => t.status === "open");
  // The calendar shows whenever there's something on it, or a task that could go on it
  // (so a task can always be dragged onto it, even on an empty day)
  const hasCalendar = fixed.length > 0 || plan.length > 0 || canFit;
  const hasUntimed = tasks.length === 0 || untimed.length > 0;
  const windowStart = toMinutes(schedule.windowStart);

  const toggle = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) onToggle(id, task.status === "done");
  };

  const openTaskMenu = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const open = task.status !== "done";
    const options = [
      ...(open ? ["Change time"] : []),
      ...(open && onSkipForToday ? ["Snooze until tomorrow"] : []),
      ...(open && onSendToSlate ? ["Send back to the Slate"] : []),
      "Edit",
      "Cancel",
    ];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        title: task.title,
        userInterfaceStyle: isDark ? "dark" : "light",
        tintColor: colors.primary,
      },
      (index) => {
        const choice = options[index];
        if (choice === "Change time") SheetManager.show("schedule-sheet", { payload: { taskId: id } });
        else if (choice === "Snooze until tomorrow") onSkipForToday?.(id);
        else if (choice === "Send back to the Slate") onSendToSlate?.(id);
        else if (choice === "Edit") {
          SheetManager.show("add-edit-modal", { payload: { mode: "edit", type: "task", itemId: id } });
        }
      }
    );
  };

  // The work block shows even on a day off, so the day off can be undone from it
  const openWorkMenu = () => {
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

  const allDay = events.filter((e) => e.allDay);

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
    <Animated.View ref={sectionRef}>
      <SectionHeader
        title="Tasks"
        detail={tasks.length ? `${completedCount} of ${tasks.length}` : undefined}
      />

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
          <View>
            {hasCalendar && (
              <ThemedText type="eyebrow" tone="textTertiary" style={styles.untimedLabel}>
                No time yet
              </ThemedText>
            )}
            <Card padded={false} clip>
              {sortedUntimed.map((task, i) => (
                <Animated.View key={task.id} layout={rowLayout}>
                  {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <DraggableRow
                    task={task}
                    enabled={hasCalendar && task.status === "open"}
                    fingerY={fingerY}
                    dropAt={dropAt}
                    onLift={lift}
                    onLand={land}
                  >
                    {taskRow(task)}
                  </DraggableRow>
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

      {allDay.length > 0 && (
        <View style={[styles.allDay, hasUntimed && styles.below]}>
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

      {hasCalendar && (
        <View style={!allDay.length && hasUntimed ? styles.below : undefined}>
          <PlanTimeline
            fixed={fixed}
            plan={plan}
            now={now}
            earliest={0}
            minRange={{ start: windowStart, end: toMinutes(schedule.windowEnd) }}
            focus={now > windowStart ? now - 60 : windowStart}
            maxHeight={0.4}
            onToggle={toggle}
            onPress={openTaskMenu}
            onPressFixed={(b) => b.kind === "work" && openWorkMenu()}
            onDragActive={onDragActive}
            obscured={obscured}
            refocusOnResume
            onDrop={(id, start) => updateTask(id, { startTime: toHHmm(start) })}
            incoming={
              carried && {
                title: carried.title,
                length: carried.durationMin ?? DEFAULT_DURATION,
                y: fingerY,
                minute: dropAt,
              }
            }
          />
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

      {carried && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ghost,
            { backgroundColor: colors.surface, borderColor: colors.primary },
            shadow(scheme, 3),
            ghostStyle,
          ]}
        >
          <ThemedText type="bodyMedium" numberOfLines={1}>
            {carried.title}
          </ThemedText>
          <ThemedText type="caption" tone="textTertiary">
            Drop it on the calendar
          </ThemedText>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const hapticLift = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};
const hapticDrop = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * A task without a time that can be held and carried onto the calendar. The row itself
 * stays (dimmed); the section draws the copy that follows the finger, and the calendar
 * reports in `dropAt` the start under it.
 */
function DraggableRow({
  task,
  enabled,
  fingerY,
  dropAt,
  onLift,
  onLand,
  children,
}: {
  task: Task;
  enabled: boolean;
  fingerY: SharedValue<number>;
  dropAt: SharedValue<number>;
  onLift: (task: Task) => void;
  onLand: (id: string, minute: number) => void;
  children: React.ReactNode;
}) {
  const held = useSharedValue(false);
  const pan = Gesture.Pan()
    .enabled(enabled)
    .activateAfterLongPress(LIFT_MS)
    .onStart((e) => {
      held.value = true;
      dropAt.value = -1;
      fingerY.value = e.absoluteY;
      scheduleOnRN(onLift, task);
      scheduleOnRN(hapticLift);
    })
    .onUpdate((e) => {
      fingerY.value = e.absoluteY;
    })
    .onFinalize((_e, success) => {
      if (!held.value) return;
      held.value = false;
      // A cancelled drag (a call, the app backgrounded) doesn't drop
      const minute = success ? dropAt.value : -1;
      fingerY.value = -1;
      dropAt.value = -1;
      scheduleOnRN(onLand, task.id, minute);
      if (minute >= 0) scheduleOnRN(hapticDrop);
    });
  const style = useAnimatedStyle(() => ({
    opacity: withTiming(held.value ? 0.4 : 1, { duration: 120 }),
  }));
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={style}>{children}</Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 58 },
  flex: { flex: 1 },
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
  below: { marginTop: 18 },
  ghost: {
    position: "absolute",
    left: 24,
    right: 24,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    zIndex: 30,
  },
  untimedLabel: { marginLeft: 4, marginBottom: 8 },
  fit: { alignSelf: "flex-start", marginTop: 10 },
});
