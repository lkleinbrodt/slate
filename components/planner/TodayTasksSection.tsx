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
/** Hold this long before a task lifts, so a quick swipe still scrolls */
const LIFT_MS = 220;
/** Finger this close to the top of the screen or the tab bar scrolls the page */
const PAGE_EDGE = 90;
/** The tab bar space includes this much breathing room above the bar itself */
const BAR_GAP = 24;
const PAGE_SPEED = 10;
/** The zoomed-in calendar's title strip, under the status bar: let go here to cancel */
const ZOOM_HEADER = 64;
const ZOOM_IN_MS = 200;
const ZOOM_OUT_MS = 180;
const DAY = 24 * 60;

type View_ = "list" | "day";

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
 * Today's tasks, two ways.
 *
 * **List** (the default): every task in one list, in the order you'd do them: those
 * without a time, then those with one by time (a missed one says so), done ones at the
 * bottom. Hold a task and the screen zooms into the day's calendar with the task under
 * your finger; drag it to a time and let go, and it zooms back out with the task in its
 * new place. Let go above the calendar to leave it as it was.
 *
 * **Day**: the tasks without a time, and below them a calendar with the timed tasks, the
 * work block and your calendar's events. Hold a timed task to move it; carry a task
 * without a time onto the calendar to give it one.
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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  // The floating tab bar covers the bottom of the screen
  const obscured = { top: insets.top, bottom: useTabBarSpace() - BAR_GAP };

  const [view, setView] = useState<View_>("list");
  const viewRef = useRef(view);
  viewRef.current = view;
  const listMode = useSharedValue(true);
  useEffect(() => {
    listMode.value = view === "list";
  }, [view, listMode]);

  // A held task. The row stays put (dimmed). In Day view a copy follows the finger until
  // it's over the calendar, which then shows where it would land; in List view the
  // screen zooms into a calendar of its own, which does the same.
  const [carried, setCarried] = useState<Task | null>(null);
  const fingerY = useSharedValue(-1);
  const dropAt = useSharedValue(-1);
  const sectionRef = useAnimatedRef<Animated.View>();
  // Where the section is on screen, so things drawn in it can be placed on the screen
  const sectionBox = useSharedValue({ x: 0, y: 0 });
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

  // The zoomed-in calendar (List view): on screen from the lift until it has faded out
  const [zoom, setZoom] = useState<{ key: number; title: string; anchor: { minute: number; offset: number } } | null>(
    null
  );
  const zoomIn = useSharedValue(0);
  const zoomTop = insets.top + ZOOM_HEADER;
  const zoomHeight = screenHeight - zoomTop - obscured.bottom;

  // Only runs while a task is carried, so the idle screen doesn't wake the UI thread
  const frame = useFrameCallback(() => {
    const y = fingerY.value;
    if (y < 0) return;
    const box = measure(sectionRef);
    if (box) sectionBox.value = { x: box.pageX, y: box.pageY };
    // Over the calendar, it scrolls itself; elsewhere near an edge, the page scrolls
    // (Day view only: the zoomed calendar covers the page)
    if (!page || listMode.value || dropAt.value >= 0) return;
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
    top: fingerY.value - sectionBox.value.y - 26,
    opacity: withTiming(fingerY.value >= 0 && dropAt.value < 0 ? 1 : 0, { duration: 120 }),
  }));
  // Pinned to the screen's top-left from inside the page; grows in from a little smaller
  const zoomStyle = useAnimatedStyle(() => ({
    top: -sectionBox.value.y,
    left: -sectionBox.value.x,
    opacity: zoomIn.value,
    transform: [{ scale: 0.94 + 0.06 * zoomIn.value }],
  }));
  const placingHint = useAnimatedStyle(() => ({ opacity: dropAt.value >= 0 ? 1 : 0 }));
  const cancelHint = useAnimatedStyle(() => ({ opacity: dropAt.value >= 0 ? 0 : 1 }));

  const setWorkDayOff = useSettingsStore((s) => s.setWorkDayOff);
  const router = useRouter();
  const { today, work, dayOff, events, now, schedule } = useDaySchedule();
  const access = useCalendarStore((s) => s.access);
  const requestAccess = useCalendarStore((s) => s.requestAccess);
  const completedCount = tasks.filter((task) => task.status === "done").length;

  const lift = (task: Task) => {
    armed.value = false;
    frame.setActive(true);
    setCarried(task);
    onDragActive?.(true);
    if (viewRef.current !== "list") return;
    // Zoom in with the task under the finger: at its time, or now for one without
    const length = task.durationMin ?? DEFAULT_DURATION;
    const minute = taskInterval(task)?.start ?? Math.min(DAY - length, Math.ceil(now / 15) * 15);
    // Read out here: an updater runs during render, where shared values mustn't be read
    const offset = fingerY.value - zoomTop;
    setZoom((z) => ({ key: (z?.key ?? 0) + 1, title: task.title, anchor: { minute, offset } }));
    zoomIn.value = withTiming(1, { duration: ZOOM_IN_MS });
  };
  const land = (id: string, minute: number) => {
    frame.setActive(false);
    setCarried(null);
    onDragActive?.(false);
    if (minute >= 0) updateTask(id, { startTime: toHHmm(minute) });
    zoomIn.value = withTiming(0, { duration: ZOOM_OUT_MS }, (finished) => {
      "worklet";
      if (finished) scheduleOnRN(setZoom, null);
    });
  };

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
  // The list: no time, then by time, then done
  const group = (t: Task) => (sinks(t) ? 2 : t.startTime ? 1 : 0);
  const listed = [...tasks].sort(
    (a, b) =>
      group(a) - group(b) ||
      (group(a) === 1 ? toMinutes(a.startTime!) - toMinutes(b.startTime!) : 0)
  );

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
  const windowStart = toMinutes(schedule.windowStart);
  const minRange = { start: windowStart, end: toMinutes(schedule.windowEnd) };
  const incoming = carried && {
    title: carried.title,
    length: carried.durationMin ?? DEFAULT_DURATION,
    y: fingerY,
    minute: dropAt,
  };

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
  const canFit = untimed.some((t) => t.status === "open");

  const rows = (list: Task[], draggable: (t: Task) => boolean) => (
    <Card padded={false} clip>
      {list.map((task, i) => (
        <Animated.View key={task.id} layout={rowLayout}>
          {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
          <DraggableRow
            task={task}
            enabled={draggable(task)}
            fingerY={fingerY}
            dropAt={dropAt}
            sectionRef={sectionRef}
            sectionBox={sectionBox}
            onLift={lift}
            onLand={land}
          >
            <TaskItem
              task={task}
              isCompleted={task.status === "done"}
              onToggle={onToggle}
              onSkipForToday={onSkipForToday}
              onSendToSlate={onSendToSlate}
              now={now}
            />
          </DraggableRow>
        </Animated.View>
      ))}
    </Card>
  );
  const fitButton = canFit && (
    <Button
      title="Fit these in"
      icon="sparkle"
      variant="secondary"
      size="md"
      onPress={() => SheetManager.show("fit-sheet")}
      style={styles.fit}
    />
  );

  return (
    <Animated.View ref={sectionRef}>
      <SectionHeader
        title="Tasks"
        detail={tasks.length ? `${completedCount} of ${tasks.length}` : undefined}
        accessory={<ViewToggle value={view} onChange={setView} />}
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
      ) : view === "list" ? (
        <View>
          {rows(listed, (t) => t.status === "open")}
          {fitButton}
        </View>
      ) : (
        untimed.length > 0 && (
          <View>
            <ThemedText type="eyebrow" tone="textTertiary" style={styles.untimedLabel}>
              No time yet
            </ThemedText>
            {rows(sortedUntimed, (t) => t.status === "open")}
            {fitButton}
          </View>
        )
      )}

      {view === "day" && (
        <View style={tasks.length === 0 || untimed.length > 0 ? styles.below : undefined}>
          <PlanTimeline
            fixed={fixed}
            plan={plan}
            now={now}
            earliest={0}
            minRange={minRange}
            focus={now > windowStart ? now - 60 : windowStart}
            maxHeight={0.4}
            onToggle={toggle}
            onPress={openTaskMenu}
            onPressFixed={(b) => b.kind === "work" && openWorkMenu()}
            onDragActive={onDragActive}
            obscured={obscured}
            refocusOnResume
            onDrop={(id, start) => updateTask(id, { startTime: toHHmm(start) })}
            incoming={incoming}
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

      {carried && view === "day" && (
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

      {/* The finger stays with the row's gesture, so the zoomed calendar takes no touches */}
      {zoom && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.zoom,
            { width: screenWidth, height: screenHeight, backgroundColor: colors.background },
            zoomStyle,
          ]}
        >
          <View style={[styles.zoomHeader, { paddingTop: insets.top, height: zoomTop }]}>
            <ThemedText type="bodyMedium" numberOfLines={1}>
              {zoom.title}
            </ThemedText>
            <View>
              <Animated.View style={placingHint}>
                <ThemedText type="caption" tone="textTertiary">
                  Let go to set the time
                </ThemedText>
              </Animated.View>
              <Animated.View style={[styles.overlap, cancelHint]}>
                <ThemedText type="caption" style={{ color: colors.primary }}>
                  Let go here to leave it as it is
                </ThemedText>
              </Animated.View>
            </View>
          </View>
          <View style={styles.zoomCalendar}>
            <PlanTimeline
              key={zoom.key}
              fixed={fixed}
              plan={carried ? plan.filter((b) => b.id !== carried.id) : plan}
              now={now}
              earliest={0}
              minRange={minRange}
              maxHeight={zoomHeight / screenHeight}
              anchor={zoom.anchor}
              obscured={obscured}
              onToggle={toggle}
              onDrop={() => {}}
              incoming={incoming}
            />
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
};

/** List or Day, in the section header */
function ViewToggle({ value, onChange }: { value: View_; onChange: (v: View_) => void }) {
  const { colors, scheme } = useTheme();
  return (
    <View style={[styles.toggle, { backgroundColor: colors.surfaceSunken }]} accessibilityRole="tablist">
      {(["list", "day"] as const).map((v) => {
        const on = v === value;
        return (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            hitSlop={6}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.toggleItem, on && [{ backgroundColor: colors.surface }, shadow(scheme, 1)]]}
          >
            <ThemedText type="captionMedium" tone={on ? "text" : "textTertiary"}>
              {v === "list" ? "List" : "Day"}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const hapticLift = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};
const hapticDrop = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * A task row that can be held and carried onto a calendar. The row itself stays
 * (dimmed); the section draws what follows the finger, and the calendar reports in
 * `dropAt` the start under it.
 */
function DraggableRow({
  task,
  enabled,
  fingerY,
  dropAt,
  sectionRef,
  sectionBox,
  onLift,
  onLand,
  children,
}: {
  task: Task;
  enabled: boolean;
  fingerY: SharedValue<number>;
  dropAt: SharedValue<number>;
  sectionRef: AnimatedRef<Animated.View>;
  sectionBox: SharedValue<{ x: number; y: number }>;
  onLift: (task: Task) => void;
  onLand: (id: string, minute: number) => void;
  children: React.ReactNode;
}) {
  const held = useSharedValue(false);
  const pan = Gesture.Pan()
    .enabled(enabled)
    .activateAfterLongPress(LIFT_MS)
    .onStart((e) => {
      // Before anything placed by it is drawn
      const box = measure(sectionRef);
      if (box) sectionBox.value = { x: box.pageX, y: box.pageY };
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
  zoom: { position: "absolute", zIndex: 40 },
  zoomHeader: { justifyContent: "center", paddingHorizontal: 24, gap: 2 },
  zoomCalendar: { paddingHorizontal: 16 },
  overlap: { position: "absolute", left: 0, right: 0, top: 0 },
  untimedLabel: { marginLeft: 4, marginBottom: 8 },
  fit: { alignSelf: "flex-start", marginTop: 10 },
  toggle: { flexDirection: "row", borderRadius: Radius.pill, padding: 2 },
  toggleItem: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.pill },
});
