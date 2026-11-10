import React, { useEffect, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Radius } from "@/constants/theme";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ThemedText } from "@/components/themed-text";
import { TimePickerButton } from "@/components/TimePickerButton";
import { TimePickerModal } from "@/components/TimePickerModal";
import { useCalendarStore } from "@/lib/stores/calendarStore";
import { useSettingsStore } from "@/lib/stores/settings";
import { useTheme } from "@/hooks/use-theme";

type Field = "workStart" | "workEnd" | "windowStart" | "windowEnd";

const TITLES: Record<Field, string> = {
  workStart: "Work starts",
  workEnd: "Work ends",
  windowStart: "Plan from",
  windowEnd: "Plan until",
};

/** Time slots (lib/logic/schedule.ts): the work block Slate keeps clear on weekdays, the
 * hours it may place tasks in, and access to the iOS calendar */
export function ScheduleSettings() {
  const { colors } = useTheme();
  const schedule = useSettingsStore((s) => s.schedule);
  const updateSchedule = useSettingsStore((s) => s.updateSchedule);
  const access = useCalendarStore((s) => s.access);
  const refresh = useCalendarStore((s) => s.refresh);
  const requestAccess = useCalendarStore((s) => s.requestAccess);
  const [editing, setEditing] = useState<Field | null>(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = (time: string) => {
    if (!editing) return;
    const pair: [Field, Field] = editing.startsWith("work")
      ? ["workStart", "workEnd"]
      : ["windowStart", "windowEnd"];
    let start = editing === pair[0] ? time : schedule[pair[0]];
    let end = editing === pair[1] ? time : schedule[pair[1]];
    // Keep the range valid by moving the other end if they cross
    if (start > end) {
      if (editing === pair[0]) end = start;
      else start = end;
    }
    updateSchedule({ [pair[0]]: start, [pair[1]]: end });
  };

  const calendarNote =
    access === "granted"
      ? "Your events show on Today. Tasks with a time go in a “Slate” calendar."
      : access === "denied"
      ? "Calendar access is off. Turn it on in iOS Settings to see events on Today."
      : "See your events on Today, and put tasks with a time in your calendar.";

  return (
    <View>
      <SectionHeader title="Schedule" />
      <Card padded={false} clip>
        <Row icon="briefcase" title="Work hours" note="Weekdays. Slate never plans tasks in them.">
          <TimePickerButton time={schedule.workStart} onPress={() => setEditing("workStart")} compact />
          <ThemedText type="caption" tone="textTertiary">to</ThemedText>
          <TimePickerButton time={schedule.workEnd} onPress={() => setEditing("workEnd")} compact />
        </Row>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Row icon="clock" title="Plannable hours" note="When Slate may put tasks.">
          <TimePickerButton time={schedule.windowStart} onPress={() => setEditing("windowStart")} compact />
          <ThemedText type="caption" tone="textTertiary">to</ThemedText>
          <TimePickerButton time={schedule.windowEnd} onPress={() => setEditing("windowEnd")} compact />
        </Row>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: colors.surfaceSunken }]}>
            <Icon name="calendarDots" size={20} color="textSecondary" weight="duotone" />
          </View>
          <View style={styles.flex}>
            <ThemedText type="bodyMedium">Calendar</ThemedText>
            <ThemedText type="caption" tone="textTertiary">
              {calendarNote}
            </ThemedText>
            {access !== "granted" && access !== null && (
              <Button
                title={access === "denied" ? "Open Settings" : "Allow calendar"}
                size="md"
                variant="secondary"
                onPress={access === "denied" ? () => Linking.openSettings() : requestAccess}
                style={styles.button}
              />
            )}
          </View>
        </View>
      </Card>

      {editing && (
        <TimePickerModal
          visible
          title={TITLES[editing]}
          selectedTime={schedule[editing]}
          onTimeSelect={save}
          onClose={() => setEditing(null)}
        />
      )}
    </View>
  );
}

function Row({
  icon,
  title,
  note,
  children,
}: {
  icon: IconName;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: colors.surfaceSunken }]}>
          <Icon name={icon} size={20} color="textSecondary" weight="duotone" />
        </View>
        <View style={styles.flex}>
          <ThemedText type="bodyMedium">{title}</ThemedText>
          <ThemedText type="caption" tone="textTertiary">
            {note}
          </ThemedText>
        </View>
      </View>
      <View style={styles.times}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { paddingBottom: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: { flex: 1, gap: 2 },
  times: { flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 68 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
  button: { alignSelf: "flex-start", marginTop: 10 },
});
