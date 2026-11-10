import React, { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import { PressableScale } from "@/components/ui/PressableScale";
import { Radius } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { TimePickerModal } from "@/components/TimePickerModal";
import { formatTime } from "@/components/TimePickerButton";
import {
  DURATION_CHOICES,
  type Interval,
  formatDuration,
  suggestSlots,
  toHHmm,
  toMinutes,
} from "@/lib/logic/schedule";
import { useDaySchedule } from "@/hooks/use-day-schedule";
import { useTheme } from "@/hooks/use-theme";

/** Which slot is picked. "next" and "later" are the suggestions, worked out again when
 * the length changes, so the pick still fits. */
export type SlotChoice = "next" | "later" | "none" | { at: string };

/** HH:mm for a choice, or null for no time */
export function resolveSlot(choice: SlotChoice, suggestions: Interval[]): string | null {
  if (choice === "none") return null;
  if (choice === "next") return suggestions[0] ? toHHmm(suggestions[0].start) : null;
  if (choice === "later") return suggestions[1] ? toHHmm(suggestions[1].start) : null;
  return choice.at;
}

/** Up to two places a task of `duration` fits today (`taskId`: one being moved) */
export function useSuggestions(duration: number, taskId?: string) {
  const { gapsFor } = useDaySchedule();
  return suggestSlots(duration, gapsFor(taskId ? [taskId] : []));
}

/** "3:10 – 4:40 PM" */
export function formatRange(start: number, end: number) {
  const a = formatTime(toHHmm(start));
  const b = formatTime(toHHmm(Math.min(end, 24 * 60 - 1)));
  // Drop the first AM/PM when both match
  return a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)} – ${b}` : `${a} – ${b}`;
}

interface ScheduleOptionsProps {
  duration: number;
  onDurationChange: (minutes: number) => void;
  choice: SlotChoice;
  onChoiceChange: (choice: SlotChoice) => void;
  suggestions: Interval[];
}

/** "How long" chips and the "When today" list, for the add sheet and the time sheet */
export function ScheduleOptions({
  duration,
  onDurationChange,
  choice,
  onChoiceChange,
  suggestions,
}: ScheduleOptionsProps) {
  const { work, events, now } = useDaySchedule();
  const [picking, setPicking] = useState(false);
  const custom = typeof choice === "object" ? choice.at : null;
  const durations = DURATION_CHOICES.includes(duration)
    ? DURATION_CHOICES
    : [...DURATION_CHOICES, duration].sort((a, b) => a - b);

  // Says why a suggestion is where it is: right after something, or the start of the evening
  const reason = (slot: Interval) => {
    if (work && slot.start === work.end) return "Right after work";
    const before = events.find((e) => !e.allDay && e.end <= slot.start && slot.start - e.end <= 10);
    if (before) return `After ${before.title}`;
    if (slot.start <= now + 5) return "Next free time";
    return slot.start < 12 * 60 ? "This morning" : slot.start < 17 * 60 ? "This afternoon" : "This evening";
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.group}>
        <ThemedText type="eyebrow" tone="textTertiary">
          How long
        </ThemedText>
        <View style={styles.chips}>
          {durations.map((m) => (
            <Chip
              key={m}
              size="md"
              tone="primary"
              filled={m === duration}
              label={formatDuration(m)}
              onPress={() => onDurationChange(m)}
            />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <ThemedText type="eyebrow" tone="textTertiary">
          When today
        </ThemedText>
        {suggestions.map((slot, i) => (
          <Option
            key={i}
            selected={choice === (i === 0 ? "next" : "later")}
            title={formatRange(slot.start, slot.end)}
            detail={reason(slot)}
            tag={i === 0 ? "Next free" : undefined}
            onPress={() => onChoiceChange(i === 0 ? "next" : "later")}
          />
        ))}
        {!suggestions.length && (
          <ThemedText type="caption" tone="textTertiary" style={styles.none}>
            No free time left today that fits {formatDuration(duration)}.
          </ThemedText>
        )}
        <Option
          selected={!!custom}
          title={custom ? formatRange(toMinutes(custom), toMinutes(custom) + duration) : "Pick a time…"}
          detail={custom ? "Your time · tap to change" : "Any time, work hours included"}
          onPress={() => setPicking(true)}
        />
        <Option
          selected={choice === "none"}
          title="No time"
          detail="Just a task for today"
          onPress={() => onChoiceChange("none")}
        />
      </View>

      {picking && (
        <TimePickerModal
          visible
          title="Start at"
          selectedTime={custom ?? (suggestions[0] ? toHHmm(suggestions[0].start) : toHHmm(Math.min(Math.ceil(now / 5) * 5, 23 * 60)))}
          onTimeSelect={(at) => onChoiceChange({ at })}
          onClose={() => setPicking(false)}
        />
      )}
    </View>
  );
}

function Option({
  selected,
  title,
  detail,
  tag,
  onPress,
}: {
  selected: boolean;
  title: string;
  detail: string;
  tag?: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptics="selection"
      style={[
        styles.option,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surfaceElevated,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View
        style={[
          styles.radio,
          { borderColor: selected ? colors.primary : colors.borderStrong, borderWidth: selected ? 6 : 2 },
        ]}
      />
      <View style={styles.flex}>
        <ThemedText type="bodySemiBold">{title}</ThemedText>
        <ThemedText type="caption" tone="textSecondary">
          {detail}
        </ThemedText>
      </View>
      {tag && (
        <View style={[styles.tag, { backgroundColor: selected ? colors.surfaceElevated : colors.primarySoft }]}>
          <ThemedText type="eyebrow" style={{ color: colors.primary }}>
            {tag}
          </ThemedText>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  group: { gap: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  radio: { width: 20, height: 20, borderRadius: 10 },
  flex: { flex: 1 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  none: { paddingHorizontal: 4 },
});
