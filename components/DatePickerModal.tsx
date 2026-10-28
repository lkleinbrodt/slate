// Date picker sheet: quick picks for the common cases, a calendar for the rest
import { FontFamily, Radius } from "@/constants/theme";
import { Sheet, SheetHeader } from "@/components/ui/Sheet";
import { SheetManager, SheetProps } from "react-native-actions-sheet";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Calendar } from "react-native-calendars";
import { Icon } from "@/components/ui/Icon";
import { PressableScale } from "@/components/ui/PressableScale";
import React from "react";
import { ThemedText } from "@/components/themed-text";
import dayjs from "dayjs";
import { useTheme } from "@/hooks/use-theme";
import { useTimeStore } from "@/lib/stores/timeStore";

type DatePickerActionSheetProps = SheetProps<"date-picker-sheet">;

export default function DatePickerActionSheet({
  sheetId,
  payload,
}: DatePickerActionSheetProps) {
  const { colors } = useTheme();
  const today = useTimeStore((s) => s.currentDate);
  const {
    onDateSelect,
    selectedDate = null,
    title = "Pick a day",
    minDate,
  } = payload || {};

  const select = (date: string | null) => {
    onDateSelect?.(date);
    SheetManager.hide(sheetId);
  };

  const base = dayjs(today);
  const daysToSaturday = (6 - base.day() + 7) % 7 || 7;
  const daysToMonday = (8 - base.day()) % 7 || 7;
  const quickPicks = [
    { label: "Today", icon: "sun" as const, date: today },
    { label: "Tomorrow", icon: "sunHorizon" as const, date: base.add(1, "day").format("YYYY-MM-DD") },
    { label: "Saturday", icon: "leaf" as const, date: base.add(daysToSaturday, "day").format("YYYY-MM-DD") },
    { label: "Next week", icon: "calendar" as const, date: base.add(daysToMonday, "day").format("YYYY-MM-DD") },
  ].filter((p) => !minDate || p.date >= minDate);

  return (
    <Sheet id={sheetId}>
      <SheetHeader sheetId={sheetId} title={title} />

      <View style={styles.quick}>
        {quickPicks.map((pick) => {
          const active = pick.date === selectedDate;
          return (
            <PressableScale
              key={pick.label}
              haptics="selection"
              onPress={() => select(pick.date)}
              style={[
                styles.pick,
                {
                  backgroundColor: active ? colors.primary : colors.surfaceSunken,
                },
              ]}
            >
              <Icon
                name={pick.icon}
                size={18}
                color={active ? colors.onPrimary : colors.textSecondary}
                weight="duotone"
              />
              <ThemedText
                type="captionMedium"
                style={{ color: active ? colors.onPrimary : colors.text }}
              >
                {pick.label}
              </ThemedText>
              <ThemedText
                type="caption"
                style={{ color: active ? colors.onPrimary : colors.textTertiary }}
              >
                {dayjs(pick.date).format("ddd D")}
              </ThemedText>
            </PressableScale>
          );
        })}
      </View>

      <View style={[styles.calendarWrap, { borderColor: colors.border }]}>
        <Calendar
          key={colors.background}
          onDayPress={(day) => select(day.dateString)}
          minDate={minDate}
          current={selectedDate || today}
          markedDates={
            selectedDate
              ? { [selectedDate]: { selected: true, selectedColor: colors.primary } }
              : undefined
          }
          renderArrow={(direction) => (
            <Icon
              name={direction === "left" ? "caretLeft" : "caretRight"}
              size={18}
              color="text"
              weight="bold"
            />
          )}
          theme={{
            calendarBackground: "transparent",
            textSectionTitleColor: colors.textTertiary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.onPrimary,
            todayTextColor: colors.primary,
            dayTextColor: colors.text,
            textDisabledColor: colors.textTertiary + "80",
            monthTextColor: colors.text,
            textDayFontFamily: FontFamily.sans,
            textMonthFontFamily: FontFamily.serif,
            textDayHeaderFontFamily: FontFamily.sansSemiBold,
            textDayFontSize: 15,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 11,
          }}
        />
      </View>

      {selectedDate && (
        <Button
          title="Remove date"
          icon="x"
          variant="ghost"
          size="md"
          onPress={() => select(null)}
          style={styles.clear}
        />
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  quick: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
  },
  pick: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: 12,
    borderRadius: Radius.lg,
  },
  calendarWrap: {
    marginHorizontal: 12,
    marginTop: 12,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  clear: { alignSelf: "center", marginTop: 4 },
});
