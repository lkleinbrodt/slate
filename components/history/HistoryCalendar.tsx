import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import React, { useCallback, useMemo, useState } from "react";
import Svg, { Circle } from "react-native-svg";

import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PressableScale, haptic } from "@/components/ui/PressableScale";
import { ThemedText } from "@/components/themed-text";
import dayjs from "dayjs";
import { getSixMonthsAgo } from "@/lib/logic/dates";
import { useFocusEffect } from "expo-router";
import { useHistoryStore } from "@/lib/stores/historyStore";
import { useTheme } from "@/hooks/use-theme";
import { useTimeStore } from "@/lib/stores/timeStore";

interface HistoryCalendarProps {
  onDayPress: (date: string) => void;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export const HistoryCalendar = ({ onDayPress }: HistoryCalendarProps) => {
  const { calendarData, loadCalendarData } = useHistoryStore();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const currentDate = useTimeStore((s) => s.currentDate);

  // From the app's day, not the calendar: between midnight and the day start
  // on the 1st, "today" is still last month
  const [month, setMonth] = useState(() => currentDate.substring(0, 7));
  const earliestMonth = getSixMonthsAgo().substring(0, 7);
  const latestMonth = currentDate.substring(0, 7);
  const canGoBack = month > earliestMonth;
  const canGoForward = month < latestMonth;

  // Refresh on every focus, since tabs stay mounted
  useFocusEffect(
    useCallback(() => {
      loadCalendarData(month);
    }, [loadCalendarData, month])
  );

  const weeks = useMemo(() => {
    const first = dayjs(`${month}-01`);
    const cells: (string | null)[] = Array(first.day()).fill(null);
    for (let d = 1; d <= first.daysInMonth(); d++) {
      cells.push(first.date(d).format("YYYY-MM-DD"));
    }
    while (cells.length % 7) cells.push(null);
    const rows: (string | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [month]);

  const changeMonth = (delta: number) => {
    haptic("selection");
    setMonth(dayjs(`${month}-01`).add(delta, "month").format("YYYY-MM"));
  };

  // Card padding 16 on each side, screen gutter 16 on each side
  const cellSize = Math.floor((width - 32 - 32) / 7);
  const ring = Math.min(cellSize - 6, 38);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="heading">{dayjs(`${month}-01`).format("MMMM YYYY")}</ThemedText>
        <View style={styles.arrows}>
          <PressableScale
            onPress={() => changeMonth(-1)}
            disabled={!canGoBack}
            style={[styles.arrow, { backgroundColor: colors.surfaceSunken, opacity: canGoBack ? 1 : 0.35 }]}
            accessibilityLabel="Previous month"
          >
            <Icon name="caretLeft" size={16} color="text" weight="bold" />
          </PressableScale>
          <PressableScale
            onPress={() => changeMonth(1)}
            disabled={!canGoForward}
            style={[styles.arrow, { backgroundColor: colors.surfaceSunken, opacity: canGoForward ? 1 : 0.35 }]}
            accessibilityLabel="Next month"
          >
            <Icon name="caretRight" size={16} color="text" weight="bold" />
          </PressableScale>
        </View>
      </View>

      <View style={styles.week}>
        {WEEKDAYS.map((d, i) => (
          <View key={i} style={[styles.cell, { width: cellSize, height: 24 }]}>
            <ThemedText type="eyebrow" tone="textTertiary">
              {d}
            </ThemedText>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.week}>
          {week.map((date, di) => {
            if (!date) return <View key={di} style={{ width: cellSize, height: cellSize }} />;
            const data = calendarData[date];
            const isFuture = date > currentDate;
            const isToday = date === currentDate;
            const total = data?.habitsTotal ?? 0;
            const done = data?.habitsCompleted ?? 0;
            const isPerfect = !!data?.isPerfectDay;
            const fraction = total > 0 ? done / total : 0;
            const r = (ring - 4) / 2;
            const circumference = 2 * Math.PI * r;
            const textColor = isPerfect
              ? colors.onPrimary
              : isFuture
              ? colors.textTertiary
              : isToday
              ? colors.primary
              : colors.text;

            return (
              <Pressable
                key={di}
                disabled={isFuture}
                onPress={() => {
                  haptic("selection");
                  onDayPress(date);
                }}
                style={[styles.cell, { width: cellSize, height: cellSize }]}
                accessibilityLabel={`${dayjs(date).format("MMMM D")}${total ? `, ${done} of ${total} habits` : ""}`}
              >
                <View style={[styles.ringBox, { width: ring, height: ring }]}>
                <Svg width={ring} height={ring} style={styles.ringSvg}>
                  {isPerfect ? (
                    <Circle cx={ring / 2} cy={ring / 2} r={ring / 2} fill={colors.habit} />
                  ) : (
                    <>
                      {total > 0 && (
                        <Circle
                          cx={ring / 2}
                          cy={ring / 2}
                          r={r}
                          stroke={colors.surfaceSunken}
                          strokeWidth={3}
                          fill="none"
                        />
                      )}
                      {fraction > 0 && (
                        <Circle
                          cx={ring / 2}
                          cy={ring / 2}
                          r={r}
                          stroke={colors.habit}
                          strokeWidth={3}
                          strokeLinecap="round"
                          fill="none"
                          strokeDasharray={circumference}
                          strokeDashoffset={circumference * (1 - fraction)}
                          transform={`rotate(-90 ${ring / 2} ${ring / 2})`}
                        />
                      )}
                      {isToday && total === 0 && (
                        <Circle
                          cx={ring / 2}
                          cy={ring / 2}
                          r={r}
                          stroke={colors.primary}
                          strokeWidth={1.5}
                          fill="none"
                        />
                      )}
                    </>
                  )}
                </Svg>
                  <ThemedText
                    type={isToday || isPerfect ? "calloutMedium" : "callout"}
                    style={[styles.dayText, { color: textColor }]}
                  >
                    {Number(date.slice(8))}
                  </ThemedText>
                  {(data?.tasksCompleted ?? 0) > 0 && (
                    <View
                      style={[
                        styles.taskDot,
                        { backgroundColor: isPerfect ? colors.onPrimary : colors.primary },
                      ]}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={[styles.legend, { borderTopColor: colors.border }]}>
        <Legend swatch={<View style={[styles.swatch, { backgroundColor: colors.habit }]} />} label="Perfect day" />
        <Legend
          swatch={
            <Svg width={12} height={12}>
              <Circle cx={6} cy={6} r={4.5} stroke={colors.surfaceSunken} strokeWidth={2} fill="none" />
              <Circle
                cx={6}
                cy={6}
                r={4.5}
                stroke={colors.habit}
                strokeWidth={2}
                fill="none"
                strokeDasharray={2 * Math.PI * 4.5}
                strokeDashoffset={2 * Math.PI * 4.5 * 0.4}
                transform="rotate(-90 6 6)"
              />
            </Svg>
          }
          label="Some habits"
        />
        <Legend swatch={<View style={[styles.dot, { backgroundColor: colors.primary }]} />} label="Tasks done" />
      </View>
    </Card>
  );
};

function Legend({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <View style={styles.legendItem}>
      {swatch}
      <ThemedText type="caption" tone="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingBottom: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  arrows: { flexDirection: "row", gap: 8 },
  arrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  week: { flexDirection: "row" },
  cell: { alignItems: "center", justifyContent: "center" },
  ringBox: { alignItems: "center", justifyContent: "center" },
  ringSvg: { position: "absolute", top: 0, left: 0 },
  dayText: { fontVariant: ["tabular-nums"] },
  taskDot: { position: "absolute", bottom: 6, width: 4, height: 4, borderRadius: 2 },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    paddingTop: 12,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 3 },
});
