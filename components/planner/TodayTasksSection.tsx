import Animated, { LinearTransition } from "react-native-reanimated";
import { ActionSheetIOS, Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import React, { useEffect, useReducer, useRef } from "react";
import { Radius } from "@/constants/theme";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SheetManager } from "react-native-actions-sheet";
import type { Task } from "@/components/types";
import { TaskItem } from "@/components/TaskItem";
import { ThemedText } from "@/components/themed-text";
import { type FixedBlock, type PlanBlock, PlanTimeline } from "@/components/schedule/PlanTimeline";
import { taskInterval, toHHmm, toMinutes, workBlock } from "@/lib/logic/schedule";
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

/**
 * Today's tasks. Those with a time sit on a calendar of their own, with the work block
 * and your calendar's events: hold one and drag it to move it, and the calendar scrolls
 * when you reach its edge. The rest are below, under "No time yet", with "Fit these in".
 */
export const TodayTasksSection: React.FC<TodayTasksSectionProps> = ({
  tasks,
  onToggle,
  onSkipForToday,
  onSendToSlate,
  onDragActive,
}) => {
  const { colors, isDark } = useTheme();
  const updateTask = useAppStore((s) => s.updateTask);
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
  const hasCalendar = fixed.length > 0 || plan.length > 0;
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

      {hasCalendar && (
        <PlanTimeline
          fixed={fixed}
          plan={plan}
          now={now}
          earliest={0}
          minRange={{ start: windowStart, end: toMinutes(schedule.windowEnd) }}
          focus={now > windowStart ? now - 60 : windowStart}
          maxHeight={0.55}
          onToggle={toggle}
          onPress={openTaskMenu}
          onPressFixed={(b) => b.kind === "work" && openWorkMenu()}
          onDragActive={onDragActive}
          onDrop={(id, start) => updateTask(id, { startTime: toHHmm(start) })}
        />
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
          <View style={hasCalendar ? styles.untimed : undefined}>
            {hasCalendar && (
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
  untimed: { marginTop: 18 },
  untimedLabel: { marginLeft: 4, marginBottom: 8 },
  fit: { alignSelf: "flex-start", marginTop: 10 },
});
