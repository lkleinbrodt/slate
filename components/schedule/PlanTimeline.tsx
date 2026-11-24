import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
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

import { Checkbox } from "@/components/ui/Checkbox";
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
  /** An event from a "Just to see" calendar (or a day off): dashed, tasks can go over it */
  free?: boolean;
}

/** A task on the timeline; these can be dragged */
export interface PlanBlock {
  id: string;
  title: string;
  start: number;
  end: number;
  /** Ticked off: struck through, and it stays where it is */
  done?: boolean;
}

interface PlanTimelineProps {
  fixed: FixedBlock[];
  plan: PlanBlock[];
  /** Minutes after midnight; nothing can be dropped before it */
  now: number;
  /** While dragging: the task's start under the finger (snapped), each time it changes */
  onPreview?: (id: string, start: number | null) => void;
  /** Finger lifted: put the task at `start` */
  onDrop: (id: string, start: number) => void;
  /** Shows a ✕ on each task (the fit sheet's "leave it without a time") */
  onRemove?: (id: string) => void;
  /** Today's calendar: tasks are real ones, with a check and a tap, drawn solid */
  onToggle?: (id: string) => void;
  onPress?: (id: string) => void;
  /** A work block or event was tapped */
  onPressFixed?: (block: FixedBlock) => void;
  /** A task is held or let go: the page around the timeline should stop or resume scrolling */
  onDragActive?: (active: boolean) => void;
  /** Earliest minute a task can be dropped at (default: now) */
  earliest?: number;
  /** The timeline always covers at least this stretch of the day */
  minRange?: { start: number; end: number };
  /** Scroll so this minute is at the top when it first appears */
  focus?: number;
  /** Tallest the timeline gets, as a share of the screen (default half) */
  maxHeight?: number;
  /** A task without a time being dragged in from outside (Today's "No time yet") */
  incoming?: IncomingDrag | null;
  /** Screen edges covered by other UI (the floating tab bar): dragging scrolls the
   * timeline when the finger nears the edge of what's visible, not of what's hidden */
  obscured?: { top: number; bottom: number };
  /** Scroll back to `focus` when the app returns from the background (Today, so it
   * opens on the current hour rather than wherever it was left) */
  refocusOnResume?: boolean;
  /** A carried task starts at this minute wherever the finger is, and moves with it from
   * there (Today's zoom-in: a task starts at its time, or now). The timeline opens
   * scrolled so the minute sits `offset` points below its top, under the finger, when
   * it can. Wins over `focus`. */
  anchor?: { minute: number; offset: number };
}

/**
 * A drag that starts outside the timeline. The dragger writes the finger's page Y to `y`
 * (-1 when no drag); the timeline writes the snapped start under the finger to `minute`
 * (-1 when the finger isn't over it), draws a preview there, and scrolls at its edges.
 */
export interface IncomingDrag {
  title: string;
  length: number;
  y: SharedValue<number>;
  minute: SharedValue<number>;
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

// Runs on the UI thread too (drag styles and handlers), so it must be a worklet: calling a
// plain function there crashes a release build the moment a task is lifted
const yOf = (minute: number, rangeStart: number) => {
  "worklet";
  return PAD + (minute - rangeStart) * PX;
};

// Haptics run on the JS thread; worklets hand off to these rather than capturing the module
const hapticTick = () => {
  Haptics.selectionAsync();
};
const hapticLift = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};
const hapticDrop = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};
/** The part of a view (page Y and height) that's on the visible screen */
const clip = (pageY: number, height: number, screen: { top: number; bottom: number }) => {
  "worklet";
  const top = Math.max(pageY, screen.top);
  return { pageY: top, height: Math.max(0, Math.min(pageY + height, screen.bottom) - top) };
};
const heightOf = (b: { start: number; end: number }) => Math.max((b.end - b.start) * PX - 2, MIN_HEIGHT);

/**
 * The rest of today on a scale, with the tasks "Fit these in" placed. Hold a task and drag
 * it to move it: it snaps to quarter hours, the others get out of its way as you go (the
 * sheet works that out in `onPreview`), and the timeline scrolls and grows down to
 * midnight when you drag near its edge.
 */
export function PlanTimeline({
  fixed,
  plan,
  now,
  onPreview,
  onDrop,
  onRemove,
  onToggle,
  onPress,
  onPressFixed,
  onDragActive,
  earliest: earliestProp,
  minRange,
  focus,
  maxHeight = 0.5,
  incoming,
  obscured,
  refocusOnResume,
  anchor,
}: PlanTimelineProps) {
  const { colors, scheme } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState<string | null>(null);

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useScrollOffset(scrollRef);
  const fingerY = useSharedValue(0);
  const dragActive = useSharedValue(false);
  const viewport = useSharedValue({ top: 0, height: 0 });
  const maxScroll = useSharedValue(0);
  // Where the visible screen ends, for the edge zones
  const screen = useSharedValue({ top: 0, bottom: screenHeight });
  useEffect(() => {
    screen.value = { top: obscured?.top ?? 0, bottom: screenHeight - (obscured?.bottom ?? 0) };
  }, [obscured?.top, obscured?.bottom, screenHeight, screen]);
  // How far down a drag has reached: the timeline grows to an hour past it, so a task
  // can always go later, up to midnight
  const [reach, setReach] = useState(0);

  // The visible stretch of day: from the hour now is in, to an hour past the last thing,
  // and an hour past wherever a task is being dragged (so you can always go further)
  const everything = [...fixed, ...plan];
  const rangeStart =
    Math.floor(Math.min(now, minRange?.start ?? DAY, ...everything.map((b) => b.start)) / 60) * 60;
  const lastEnd = Math.max(now + 60, minRange?.end ?? 0, reach, ...everything.map((b) => b.end));
  const rangeEnd = Math.min(DAY, Math.ceil(lastEnd / 60) * 60 + (minRange ? 0 : 60));
  const contentHeight = yOf(rangeEnd, rangeStart) + PAD;
  const viewHeight = Math.min(contentHeight, Math.round(screenHeight * maxHeight));
  const earliest = Math.max(earliestProp ?? Math.ceil(Math.max(now, 0) / 5) * 5, rangeStart);
  // Where it opens: a little above `focus`, once
  const focusY = (minute: number) => Math.max(0, yOf(Math.max(minute, rangeStart), rangeStart) - PAD - 20);
  const [initialY] = useState(() => {
    if (anchor) {
      // The inverse of where a dragged-in block lands: it hangs from the finger by its
      // first quarter hour
      const y = yOf(Math.max(anchor.minute, rangeStart), rangeStart) + (SNAP * PX) / 2 - anchor.offset;
      return Math.max(0, Math.min(contentHeight - viewHeight, y));
    }
    return focus === undefined ? 0 : focusY(focus);
  });
  const refocus = useRef(() => {});
  refocus.current = () => {
    if (focus !== undefined && !dragging) scrollRef.current?.scrollTo({ y: focusY(focus), animated: false });
  };
  useEffect(() => {
    if (!refocusOnResume) return;
    let last = AppState.currentState;
    const sub = AppState.addEventListener("change", (state) => {
      // Only back from the background: pulling down Control Center doesn't count
      if (state === "active" && last === "background") refocus.current();
      last = state;
    });
    return () => sub.remove();
  }, [refocusOnResume]);
  const solid = !!onToggle;

  useEffect(() => {
    maxScroll.value = Math.max(0, contentHeight - viewHeight);
  }, [contentHeight, viewHeight, maxScroll]);

  // A task dragged in from outside: where it would land, read on the UI thread each frame
  const noY = useSharedValue(-1);
  const noMinute = useSharedValue(-1);
  const inY = incoming?.y ?? noY;
  const inMinute = incoming?.minute ?? noMinute;
  const bounds = useSharedValue({ start: 0, end: DAY, length: 30 });
  // A carried task's edge scrolling waits until the finger has left the edge zone once,
  // or moved well into it, so one picked up near an edge doesn't set it off
  const carry = useSharedValue({ startY: -1, scroll: 0, armed: false });
  const anchorMinute = useSharedValue(anchor?.minute ?? -1);
  useEffect(() => {
    anchorMinute.value = anchor?.minute ?? -1;
  }, [anchor?.minute, anchorMinute]);
  const [preview, setPreview] = useState<number | null>(null);
  const incomingLength = incoming?.length ?? 30;
  const lastPreview = useRef<number | null>(null);
  const showPreview = (m: number | null) => {
    setPreview(m);
    if (m !== null) {
      lastPreview.current = m;
      setReach(m + incomingLength + 60);
    } else if (lastPreview.current !== null) {
      // Dropped, or off the timeline: keep room for where it was, no more
      setReach(lastPreview.current + incomingLength);
      lastPreview.current = null;
    }
  };
  useEffect(() => {
    bounds.value = { start: Math.max(rangeStart, earliest), end: rangeEnd, length: incoming?.length ?? 30 };
  }, [rangeStart, rangeEnd, earliest, incoming?.length, bounds]);
  useAnimatedReaction(
    () => inMinute.value,
    (m, before) => {
      if (m === before) return;
      scheduleOnRN(showPreview, m >= 0 ? m : null);
      if (m >= 0) scheduleOnRN(hapticTick);
    }
  );

  // Scroll while a task is held near the top or bottom edge, faster the closer it is.
  // Only runs during a drag, so the idle screen doesn't wake the UI thread every frame.
  const frame = useFrameCallback(() => {
    const fy = inY.value;
    if (fy < 0) {
      if (carry.value.startY >= 0) carry.value = { startY: -1, scroll: 0, armed: false };
    } else {
      const box = measure(scrollRef);
      if (!box) return;
      const view = clip(box.pageY, box.height, screen.value);
      if (fy < view.pageY || fy > view.pageY + view.height) {
        inMinute.value = -1;
        return;
      }
      const inZone = fy < view.pageY + EDGE || fy > view.pageY + view.height - EDGE;
      if (carry.value.startY < 0) carry.value = { startY: fy, scroll: scrollY.value, armed: !inZone };
      else if (!carry.value.armed && (!inZone || Math.abs(fy - carry.value.startY) > 24))
        carry.value = { ...carry.value, armed: true };
      const { start, end, length } = bounds.value;
      let snapped: number;
      const from = anchorMinute.value;
      if (from >= 0) {
        // From its starting minute, by how far the finger (and the timeline) has gone; a
        // nudge of a few minutes keeps it
        const moved = (fy - carry.value.startY + scrollY.value - carry.value.scroll) / PX;
        snapped = Math.abs(moved) < SNAP / 2 ? from : Math.round((from + moved) / SNAP) * SNAP;
      } else {
        // The block hangs from the finger by its first quarter hour
        const raw = start + (fy - box.pageY + scrollY.value - PAD - (SNAP * PX) / 2) / PX;
        snapped = Math.round(raw / SNAP) * SNAP;
      }
      inMinute.value = Math.max(start, Math.min(end - length, snapped));
      if (!carry.value.armed) return;
      let speed = 0;
      if (fy < view.pageY + EDGE) speed = -Math.min(1, (view.pageY + EDGE - fy) / EDGE) * MAX_SPEED;
      else if (fy > view.pageY + view.height - EDGE)
        speed = Math.min(1, (fy - (view.pageY + view.height - EDGE)) / EDGE) * MAX_SPEED;
      if (!speed) return;
      const next = Math.max(0, Math.min(maxScroll.value, scrollY.value + speed));
      if (next !== scrollY.value) scrollTo(scrollRef, 0, next, false);
      return;
    }
    if (!dragActive.value) return;
    const { pageY: top, height } = clip(viewport.value.top, viewport.value.height, screen.value);
    const y = fingerY.value;
    let speed = 0;
    if (y < top + EDGE) speed = -Math.min(1, (top + EDGE - y) / EDGE) * MAX_SPEED;
    else if (y > top + height - EDGE) speed = Math.min(1, (y - (top + height - EDGE)) / EDGE) * MAX_SPEED;
    if (!speed) return;
    const next = Math.max(0, Math.min(maxScroll.value, scrollY.value + speed));
    if (next !== scrollY.value) scrollTo(scrollRef, 0, next, false);
  }, false);
  const carrying = !!incoming;
  useEffect(() => {
    frame.setActive(!!dragging || carrying);
  }, [dragging, carrying, frame]);

  const lanes = layoutLanes(
    [
      // The work block is a backdrop: tasks put in it still get the full width
      ...fixed
        .filter((b) => b.kind !== "work")
        .map((b) => ({ key: `${b.kind}-${b.id}`, start: b.start, end: b.end })),
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
      contentOffset={{ x: 0, y: initialY }}
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
        <FixedView
          key={`${b.kind}-${b.id}`}
          block={b}
          rangeStart={rangeStart}
          onPress={onPressFixed ? () => onPressFixed(b) : undefined}
          {...place(`${b.kind}-${b.id}`)}
        />
      ))}

      {incoming && preview !== null && width > 0 && (
        <View
          pointerEvents="none"
          style={[
            styles.block,
            styles.plan,
            shadow(scheme, 3),
            {
              top: yOf(preview, rangeStart),
              left: GUTTER,
              width: blockWidth,
              height: heightOf({ start: preview, end: preview + incoming.length }),
              backgroundColor: colors.primarySoft,
              borderColor: colors.primary,
              zIndex: 20,
            },
          ]}
        >
          <View style={styles.flex}>
            <ThemedText type="calloutMedium" numberOfLines={1}>
              {incoming.title}
            </ThemedText>
            <ThemedText type="caption" numberOfLines={1} style={{ color: colors.primary }}>
              {formatRange(preview, preview + incoming.length)}
            </ThemedText>
          </View>
        </View>
      )}

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
            latest={rangeEnd}
            solid={solid}
            {...(b.id === dragging ? { left: GUTTER, width: blockWidth } : place(`plan-${b.id}`))}
            lifted={b.id === dragging}
            scrollRef={scrollRef}
            scrollY={scrollY}
            fingerY={fingerY}
            dragActive={dragActive}
            viewport={viewport}
            onLift={() => {
              setDragging(b.id);
              onDragActive?.(true);
            }}
            onPreview={(start) => {
              setReach(start + (b.end - b.start) + 60);
              onPreview?.(b.id, start);
            }}
            onDrop={(start) => {
              setReach(start + (b.end - b.start));
              setDragging(null);
              onDragActive?.(false);
              onPreview?.(b.id, null);
              onDrop(b.id, start);
            }}
            onRemove={onRemove ? () => onRemove(b.id) : undefined}
            onToggle={onToggle ? () => onToggle(b.id) : undefined}
            onPress={onPress ? () => onPress(b.id) : undefined}
          />
        ))}
    </Animated.ScrollView>
  );
}

interface DraggableBlockProps {
  block: PlanBlock;
  rangeStart: number;
  earliest: number;
  /** Minute the timeline ends: a task can't be dropped past it */
  latest: number;
  /** A real task (Today) rather than a proposal (the fit sheet) */
  solid: boolean;
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
  onRemove?: () => void;
  onToggle?: () => void;
  onPress?: () => void;
}

function DraggableBlock({
  block,
  rangeStart,
  earliest,
  latest,
  solid,
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
  onToggle,
  onPress,
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
    return Math.max(earliest, Math.min(latest - length, snapped));
  });

  useAnimatedReaction(
    () => (held.value ? target.value : null),
    (now, before) => {
      if (now !== null && before !== null && before !== undefined && now !== before) {
        scheduleOnRN(onPreview, now);
        scheduleOnRN(hapticTick);
      }
    }
  );

  const pan = Gesture.Pan()
    .enabled(!block.done)
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
      scheduleOnRN(hapticLift);
    })
    .onUpdate((e) => {
      dy.value = e.translationY;
      fingerY.value = e.absoluteY;
    })
    .onFinalize((_e, success) => {
      if (!held.value) return;
      // Cancelled (a call, the app backgrounded): back where it was
      const start = success ? target.value : origin.value.start;
      // Settle where it was dropped right away, so the re-render doesn't jump
      topY.value = yOf(start, rangeStart);
      held.value = false;
      dragActive.value = false;
      scheduleOnRN(onDrop, start);
      scheduleOnRN(hapticDrop);
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
            backgroundColor: solid ? colors.surface : colors.primarySoft,
            borderColor: solid ? (lifted ? colors.primary : colors.borderStrong) : colors.primary,
            borderStyle: lifted || solid ? "solid" : "dashed",
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
          if (!block.done) onDrop(Math.max(earliest, Math.min(latest - length, block.start + step)));
        }}
      >
        {onToggle && (
          <Checkbox
            checked={!!block.done}
            onPress={onToggle}
            size={22}
            accessibilityLabel={`Complete ${block.title}`}
          />
        )}
        <Pressable onPress={onPress} disabled={!onPress} style={styles.flex}>
          <ThemedText
            type={roomy ? "calloutMedium" : "captionMedium"}
            numberOfLines={1}
            style={block.done ? styles.done : undefined}
          >
            {block.title}
          </ThemedText>
          {roomy && (
            <ThemedText type="caption" numberOfLines={1} style={{ color: colors.primary }}>
              {formatRange(block.start, block.end)} · {formatDuration(length)}
            </ThemedText>
          )}
        </Pressable>
        {onRemove && !lifted && (
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
  onPress,
}: {
  block: FixedBlock;
  rangeStart: number;
  left: number;
  width: number;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const height = heightOf(block);
  const roomy = height >= 40;
  const look =
    block.kind === "work" && block.free
      ? { backgroundColor: "transparent", borderColor: colors.borderStrong, borderStyle: "dashed" as const }
      : block.kind === "work"
      ? { backgroundColor: colors.surfaceSunken, borderColor: "transparent" }
      : block.kind === "event" && block.free
        ? { backgroundColor: "transparent", borderColor: colors.borderStrong, borderStyle: "dashed" as const }
        : block.kind === "event"
          ? { backgroundColor: colors.surface, borderColor: colors.borderStrong }
          : { backgroundColor: colors.surfaceElevated, borderColor: colors.border };
  return (
    <Pressable
      onPress={onPress}
      pointerEvents={onPress ? "auto" : "none"}
      style={[
        styles.block,
        look,
        { top: yOf(block.start, rangeStart), left, width, height, paddingVertical: roomy ? 5 : 1 },
      ]}
    >
      {block.kind === "event" && (
        <View
          style={[styles.bar, { backgroundColor: block.color ?? colors.borderStrong, opacity: block.free ? 0.5 : 1 }]}
        />
      )}
      {block.kind === "work" && <Icon name="briefcase" size={14} color="textTertiary" weight="duotone" />}
      <View style={styles.flex}>
        <ThemedText type="caption" tone={block.free ? "textTertiary" : "textSecondary"} numberOfLines={1}>
          {block.title}
        </ThemedText>
        {roomy && block.kind !== "work" && (
          <ThemedText type="caption" tone="textTertiary" numberOfLines={1} style={styles.small}>
            {formatRange(block.start, block.end)}
            {block.free ? " · just to see" : ""}
          </ThemedText>
        )}
      </View>
    </Pressable>
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
  done: { textDecorationLine: "line-through", opacity: 0.5 },
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
