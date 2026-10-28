import { StyleSheet, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ThemedText } from "@/components/themed-text";
import { useHistoryStore } from "@/lib/stores/historyStore";
import { useTheme } from "@/hooks/use-theme";

export const HabitStreaksSection = () => {
  const { colors } = useTheme();
  const { overallStats } = useHistoryStore();
  const streaks = Object.entries(overallStats.currentStreaks).sort(
    (a, b) => b[1].streak - a[1].streak
  );
  const longest = Math.max(1, ...streaks.map(([, s]) => s.streak));

  return (
    <View>
      <SectionHeader title="Current streaks" />
      {streaks.length === 0 ? (
        <Card variant="sunken">
          <EmptyState
            compact
            art="stones"
            title="No streaks yet"
            body="Check off a habit two days running and a streak starts here."
          />
        </Card>
      ) : (
        <Card padded={false} clip>
          {streaks.map(([habitId, { title, streak }], i) => (
            <View key={habitId}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <View style={styles.row}>
                <View style={styles.info}>
                  <ThemedText type="bodyMedium" numberOfLines={1}>
                    {title}
                  </ThemedText>
                  <View style={[styles.track, { backgroundColor: colors.surfaceSunken }]}>
                    <View
                      style={[
                        styles.fill,
                        {
                          backgroundColor: streak > 0 ? colors.streak : "transparent",
                          width: `${Math.max(streak > 0 ? 4 : 0, (streak / longest) * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.count}>
                  <Icon
                    name="fire"
                    size={18}
                    color={streak > 0 ? colors.streak : colors.textTertiary}
                    weight={streak > 0 ? "fill" : "regular"}
                  />
                  <ThemedText
                    type="heading"
                    style={[styles.countText, { color: streak > 0 ? colors.text : colors.textTertiary }]}
                  >
                    {streak}
                  </ThemedText>
                </View>
              </View>
            </View>
          ))}
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 16,
  },
  info: { flex: 1, gap: 8 },
  track: { height: 6, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  count: { flexDirection: "row", alignItems: "center", gap: 4, minWidth: 52, justifyContent: "flex-end" },
  countText: { fontVariant: ["tabular-nums"] },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
});
