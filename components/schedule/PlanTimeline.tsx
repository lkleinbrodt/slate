import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  type AnimatedRef,
  type SharedValue,
  measure,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useScrollOffset,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { Icon } from "@/components/ui/Icon";
import { ThemedText } from "@/components/themed-text";
import { formatRange, formatTime } from "@/components/TimePickerButton";
import { Radius, shadow } from "@/constants/theme";
import { formatDuration, toHHmm } from "@/lib/logic/schedule";
import { useTheme } from "@/hooks/use-theme";

/** Something already on the day: an event, a task with a time, or the work block */
export interface FixedBlock {
  kind: "event" | "task" | "work";
  id: string;
  title: string;
  start: number;
  end: number;
  color?: string;
}

/** A task this plan places; these can be dragged */
export interface PlanBlock {
  id: string;
  title: string;
  start: number;
  end: number;
}

interface PlanTimelineProps {
  fixed: FixedBlock[];
  plan: PlanBlock[];
  /** Minutes after midnight; nothing can be dropped before it */
  now: number;
  /** While dragging: the task's start under the finger (snapped), each time it changes */
  onPreview: (id: string, start: number | null) => void;
  /** Finger lifted: put the task at `start` */
  onDrop: (id: string, start: number) => void;
  onRemove: (id: string) => void;
}

/** Vertical scale: 1.4 points per minute, 84 per hour. A 30 minute task is 42 tall,
 * room for its title and time. */
const PX = 1.4;
const PAD = 10;
const GUTTER = 58;
/** Space right of the blocks, in line with the sheet's padding */
const RIGHT = 20;
const MIN_HEIGHT = 22;
const SNAP = 15;
const DAY = 24 * 60;
/** Hold this long before a task lifts, so a quick swipe still scrolls */
const LIFT_MS = 220;
/** Finger this close to the top or bottom edge scrolls the timeline */
const EDGE = 56;
const MAX_SPEED = 9;

const yOf = (minute: number, rangeStart: number) => PAD + (minute - rangeStart) * PX;
const heightOf = (b: { start: number; end: number }) => Math.max((b.end - b.start) * PX - 2, MIN_HEIGHT);

/**
 * The rest of today on a scale, with the tasks "Fit these in" placed. Hold a task and drag
 * it to move it: it snaps to quarter hours, the others get out of its way as you go (the
 * sheet works that out in `onPreview`), and the timeline scrolls and grows down to
 * midnight when you drag near its edge.
 */
export function PlanTimeline({ fixed, plan, now, onPreview, onDrop, onRemove }: PlanTimelineProps) {
  const { colors } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState<string | null>(null);

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useScrollOffset(scrollRef);
  const fingerY = useSharedValue(0);
  const dragActive = useSharedValue(false);
  const viewport = useSharedValue({ top: 0, height: 0 });
  const maxScroll = useSharedValue(0);

  // The visible stretch of day: from the hour now is in, to an hour past the last thing,
  // and an hour past wherever a task is being dragged (so you can always go further)
  const everything = [...fixed, ...plan];
  const rangeStart = Math.floor(Math.min(now, ...everything.map((b) => b.start)) / 60) * 60;
  const lastEnd = Math.max(now + 60, ...everything.map((b) => b.end));
  const rangeEnd = Math.min(DAY, Math.ceil(lastEnd / 60) * 60 + 60);
  const contentHeight = yOf(rangeEnd, rangeStart) + PAD;
  const viewHeight = Math.min(contentHeight, Math.round(screenHeight * 0.5));
  const earliest = Math.ceil(Math.max(now, 0) / 5) * 5;

  useEffect(() => {
    maxScroll.value = Math.max(0, contentHeight - viewHeight);
  }, [contentHeight, viewHeight, maxScroll]);

  // Scroll while a task is held near the top or bottom edge, faster the closer it is
  useFrameCallback(() => {
    if (!dragActive.value) return;
    const { top, height } = viewport.value;
    const y = fingerY.value;
    let speed = 0;
    if (y < top + EDGE) speed = -Math.min(1, (top + EDGE - y) / EDGE) * MAX_SPEED;
    else if (y > top + height - EDGE) speed = Math.min(1, (y - (top + height - EDGE)) / EDGE) * MAX_SPEED;
    if (!speed) return;
    const next = Math.max(0, Math.min(maxScroll.value, scrollY.value + speed));
    if (next !== scrollY.value) scrollTo(scrollRef, 0, next, false);
  });

  const lanes = layoutLanes(
    [
      ...fixed.map((b) => ({ key: `${b.kind}-${b.id}`, start: b.start, end: b.end })),
      // The task being dragged floats over everything at full width
      ...plan.filter((b) => b.id !== dragging).map((b) => ({ key: `plan-${b.id}`, start: b.start, end: b.end })),
    ]
  );
  const blockWidth = Math.max(0, width - GUTTER - RIGHT);
  const place = (key: string) => {
    const lane = lanes.get(key) ?? { index: 0, count: 1 };
    const w = blockWidth / lane.count;
    return { left: GUTTER + lane.index * w, width: w - (lane.count > 1 ? 3 : 0) };
  };

  const hours: number[] = [];
  for (let m = rangeStart; m <= rangeEnd; m += 60) hours.push(m);

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={[styles.scroll, { height: viewHeight, borderColor: colors.border }]}
      contentContainerStyle={{ height: contentHeight }}
      scrollEnabled={!dragging}
      showsVerticalScrollIndicator={false}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {hours.map((m) => (
        <View key={m} style={[styles.hour, { top: yOf(m, rangeStart) }]} pointerEvents="none">
          <ThemedText type="caption" tone="textTertiary" style={styles.hourLabel}>
            {hourLabel(m)}
          </ThemedText>
          <View style={[styles.hourLine, { backgroundColor: colors.border }]} />
        </View>
      ))}

      {fixed.map((b) => (
        <FixedView key={`${b.kind}-${b.id}`} block={b} rangeStart={rangeStart} {...place(`${b.kind}-${b.id}`)} />
      ))}

      {now > rangeStart && now < rangeEnd && (
        <View style={[styles.now, { top: yOf(now, rangeStart) - 1, left: GUTTER - 4 }]} pointerEvents="none">
          <View style={[styles.nowDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.nowLine, { backgroundColor: colors.primary }]} />
        </View>
      )}

      {/* Always in the same order: moving a view among its siblings mid-drag cancels the touch */}
      {width > 0 &&
        [...plan].sort((a, b) => (a.id < b.id ? -1 : 1)).map((b) => (
          <DraggableBlock
            key={b.id}
            block={b}
            rangeStart={rangeStart}
            earliest={earliest}
            {...(b.id === dragging ? { left: GUTTER, width: blockWidth } : place(`plan-${b.id}`))}
            lifted={b.id === dragging}
            scrollRef={scrollRef}
            scrollY={scrollY}
            fingerY={fingerY}
            dragActive={dragActive}
            viewport={viewport}
            onLift={() => setDragging(b.id)}
            onPreview={(start) => onPreview(b.id, start)}
            onDrop={(start) => {
              setDragging(null);
              onPreview(b.id, null);
              onDrop(b.id, start);
            }}
            onRemove={() => onRemove(b.id)}
          />
        ))}
    </Animated.ScrollView>
  );
}

interface DraggableBlockProps {
  block: PlanBlock;
  rangeStart: number;
  earliest: number;
  left: number;
  width: number;
  lifted: boolean;
  scrollRef: AnimatedRef<Animated.ScrollView>;
  scrollY: SharedValue<number>;
  fingerY: SharedValue<number>;
  dragActive: SharedValue<boolean>;
  viewport: SharedValue<{ top: number; height: number }>;
  onLift: () => void;
  onPreview: (start: number) => void;
  onDrop: (start: number) => void;
  onRemove: () => void;
}

function DraggableBlock({
  block,
  rangeStart,
  earliest,
  left,
  width,
  lifted,
  scrollRef,
  scrollY,
  fingerY,
  dragActive,
  viewport,
  onLift,
  onPreview,
  onDrop,
  onRemove,
}: DraggableBlockProps) {
  const { colors, scheme } = useTheme();
  const length = block.end - block.start;
  const height = heightOf(block);
  const roomy = height >= 40;

  // Where it sits when not held; pushes and lane changes glide there
  const topY = useSharedValue(yOf(block.start, rangeStart));
  const leftX = useSharedValue(left);
  const w = useSharedValue(width);
  // The drag: which task's start it began from, and how far the finger has gone
  const held = useSharedValue(false);
  const origin = useSharedValue({ start: block.start, scroll: 0 });
  const dy = useSharedValue(0);

  useEffect(() => {
    if (held.value) return;
    topY.value = withTiming(yOf(block.start, rangeStart), { duration: 200 });
  }, [block.start, rangeStart, topY, held]);
  useEffect(() => {
    leftX.value = withTiming(left, { duration: 160 });
    w.value = withTiming(width, { duration: 160 });
  }, [left, width, leftX, w]);

  // The start under the finger: quarter hours, but a nudge of a few minutes keeps the
  // old time, and never before now or past midnight
  const target = useDerivedValue(() => {
    if (!held.value) return block.start;
    const moved = (dy.value + scrollY.value - origin.value.scroll) / PX;
    const raw = origin.value.start + moved;
    const snapped = Math.abs(moved) < SNAP / 2 ? origin.value.start : Math.round(raw / SNAP) * SNAP;
    return Math.max(earliest, Math.min(DAY - length, snapped));
  });

  useAnimatedReaction(
    () => (held.value ? target.value : null),
    (now, before) => {
      if (now !== null && before !== null && before !== undefined && now !== before) {
        scheduleOnRN(onPreview, now);
        scheduleOnRN(Haptics.selectionAsync);
      }
    }
  );

  const pan = Gesture.Pan()
    .activateAfterLongPress(LIFT_MS)
    .onStart((e) => {
      const view = measure(scrollRef);
      if (view) viewport.value = { top: view.pageY, height: view.height };
      origin.value = { start: block.start, scroll: scrollY.value };
      dy.value = 0;
      fingerY.value = e.absoluteY;
      held.value = true;
      dragActive.value = true;
      scheduleOnRN(onLift);
      scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Medium);
    })
    .onUpdate((e) => {
      dy.value = e.translationY;
      fingerY.value = e.absoluteY;
    })
    .onFinalize(() => {
      if (!held.value) return;
      const start = target.value;
      // Settle where it was dropped right away, so the re-render doesn't jump
      topY.value = yOf(start, rangeStart);
      held.value = false;
      dragActive.value = false;
      scheduleOnRN(onDrop, start);
      scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Light);
    });

  const style = useAnimatedStyle(() => ({
    top: held.value ? withTiming(yOf(target.value, rangeStart), { duration: 90 }) : topY.value,
    left: leftX.value,
    width: w.value,
    transform: [{ scale: withTiming(held.value ? 1.03 : 1, { duration: 140 }) }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        entering={FadeIn.duration(160)}
        exiting={FadeOut.duration(160)}
        style={[
          styles.block,
          styles.plan,
          {
            height,
            backgroundColor: colors.primarySoft,
            borderColor: colors.primary,
            borderStyle: lifted ? "solid" : "dashed",
            paddingVertical: roomy ? 5 : 1,
            zIndex: lifted ? 20 : 2,
          },
          lifted && shadow(scheme, 3),
          style,
        ]}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`${block.title}, ${formatRange(block.start, block.end)}`}
        accessibilityHint="Hold and drag to move it. Swipe up or down for 15 minutes later or earlier."
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(e) => {
          const step = e.nativeEvent.actionName === "increment" ? SNAP : -SNAP;
          onDrop(Math.max(earliest, Math.min(DAY - length, block.start + step)));
        }}
      >
        <View style={styles.flex}>
          <ThemedText type={roomy ? "calloutMedium" : "captionMedium"} numberOfLines={1}>
            {block.title}
          </ThemedText>
          {roomy && (
            <ThemedText type="caption" numberOfLines={1} style={{ color: colors.primary }}>
              {formatRange(block.start, block.end)} · {formatDuration(length)}
            </ThemedText>
          )}
        </View>
        {!lifted && (
          <Pressable
            onPress={onRemove}
            hitSlop={10}
            accessibilityLabel={`Leave ${block.title} without a time`}
          >
            <Icon name="x" size={14} color="textTertiary" weight="bold" />
          </Pressable>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

function FixedView({
  block,
  rangeStart,
  left,
  width,
}: {
  block: FixedBlock;
  rangeStart: number;
  left: number;
  width: number;
}) {
  const { colors } = useTheme();
  const height = heightOf(block);
  const roomy = height >= 40;
  const look =
    block.kind === "work"
      ? { backgroundColor: colors.surfaceSunken, borderColor: "transparent" }
      : block.kind === "event"
        ? { backgroundColor: colors.surface, borderColor: colors.borderStrong, borderStyle: "dashed" as const }
        : { backgroundColor: colors.surfaceElevated, borderColor: colors.border };
  return (
    <View
      pointerEvents="none"
      style={[
        styles.block,
        look,
        { top: yOf(block.start, rangeStart), left, width, height, paddingVertical: roomy ? 5 : 1 },
      ]}
    >
      {block.kind === "event" && <View style={[styles.bar, { backgroundColor: block.color ?? colors.borderStrong }]} />}
      {block.kind === "work" && <Icon name="briefcase" size={14} color="textTertiary" weight="duotone" />}
      <View style={styles.flex}>
        <ThemedText type="caption" tone="textSecondary" numberOfLines={1}>
          {block.title}
        </ThemedText>
        {roomy && block.kind !== "work" && (
          <ThemedText type="caption" tone="textTertiary" numberOfLines={1} style={styles.small}>
            {formatRange(block.start, block.end)}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

/**
 * Side-by-side lanes for things that overlap, as calendar apps do: each cluster of
 * overlapping blocks splits the width between as many lanes as it needs.
 */
function layoutLanes(items: { key: string; start: number; end: number }[]) {
  const out = new Map<string, { index: number; count: number }>();
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  let cluster: { key: string; lane: number }[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => {
    for (const c of cluster) out.set(c.key, { index: c.lane, count: laneEnds.length });
    cluster = [];
    laneEnds = [];
  };
  for (const item of sorted) {
    if (item.start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) lane = laneEnds.push(item.end) - 1;
    else laneEnds[lane] = item.end;
    cluster.push({ key: item.key, lane });
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  flush();
  return out;
}

/** "3 PM", "Noon", "12 AM" (midnight) */
function hourLabel(minutes: number) {
  if (minutes === 12 * 60) return "Noon";
  return formatTime(toHHmm(minutes % DAY)).replace(":00", "");
}

const styles = StyleSheet.create({
  scroll: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  flex: { flex: 1 },
  small: { fontSize: 11, lineHeight: 14 },
  hour: { position: "absolute", left: 0, right: RIGHT, flexDirection: "row", alignItems: "center", height: 14, marginTop: -7 },
  hourLabel: { width: GUTTER - 8, textAlign: "right", marginRight: 6, fontSize: 11, lineHeight: 14 },
  hourLine: { flex: 1, height: StyleSheet.hairlineWidth },
  now: { position: "absolute", right: RIGHT, flexDirection: "row", alignItems: "center", height: 8, marginTop: -3, zIndex: 5 },
  nowDot: { width: 8, height: 8, borderRadius: 4, marginRight: -2 },
  nowLine: { flex: 1, height: 2 },
  block: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
  },
  plan: { borderWidth: 1.5 },
  bar: { width: 3, alignSelf: "stretch", borderRadius: 2 },
});
