import { StyleSheet, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import React from "react";
import { ThemedText } from "@/components/themed-text";
import { useHistoryStore } from "@/lib/stores/historyStore";
import { useTheme } from "@/hooks/use-theme";

export const HistoryHeader = () => {
  const { colors } = useTheme();
  const overallStats = useHistoryStore((s) => s.overallStats);
  const bestStreak = Math.max(
    0,
    ...Object.values(overallStats.currentStreaks).map((s) => s.streak)
  );

  return (
    <View>
      <View style={styles.title}>
        <ThemedText type="greeting" tone="textSecondary">
          Look how far you&apos;ve come
        </ThemedText>
        <ThemedText type="display">History</ThemedText>
      </View>

      <View style={styles.stats}>
        <Stat
          icon="checkCircle"
          tint={colors.primary}
          tintSoft={colors.primarySoft}
          value={overallStats.tasksCompleted7d}
          label="Tasks done"
          sub="last 7 days"
        />
        <Stat
          icon="sparkle"
          tint={colors.habit}
          tintSoft={colors.habitSoft}
          value={overallStats.perfectDays}
          label="Perfect days"
          sub="last 7 days"
        />
        <Stat
          icon="fire"
          tint={colors.streak}
          tintSoft={colors.streakSoft}
          value={bestStreak}
          label="Best streak"
          sub={bestStreak === 1 ? "day" : "days"}
        />
      </View>
    </View>
  );
};

function Stat({
  icon,
  tint,
  tintSoft,
  value,
  label,
  sub,
}: {
  icon: IconName;
  tint: string;
  tintSoft: string;
  value: number;
  label: string;
  sub: string;
}) {
  return (
    <Card style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: tintSoft }]}>
        <Icon name={icon} size={18} color={tint} weight="fill" />
      </View>
      <ThemedText type="numeral" style={styles.numeral}>
        {value}
      </ThemedText>
      <View>
        <ThemedText type="captionMedium">{label}</ThemedText>
        <ThemedText type="caption" tone="textTertiary">
          {sub}
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 24,
  },
  stats: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, padding: 14, gap: 8 },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  numeral: { fontVariant: ["tabular-nums"] },
});
