// After the call: the plan Slate made from it, one toggle per change. Apply makes the kept
// changes in one go; Discard drops the lot. Closing the sheet keeps the plan for later
// ("Review your plan" on Today).
import { Alert, ScrollView, StyleSheet, Switch, View } from "react-native";
import React, { useMemo, useState } from "react";
import { Sheet, SheetHeader } from "@/components/ui/Sheet";
import { SheetManager, type SheetProps } from "react-native-actions-sheet";

import { Button } from "@/components/ui/Button";
import { ThemedText } from "@/components/themed-text";
import { describeChange } from "@/lib/voice/planDay/describe";
import { useTheme } from "@/hooks/use-theme";
import { useTimeStore } from "@/lib/stores/timeStore";
import { useVoiceStore } from "@/lib/stores/voiceStore";

export default function ReviewSheet({ sheetId }: SheetProps<"voice-review">) {
  const { colors } = useTheme();
  const today = useTimeStore((s) => s.currentDate);
  // The plan as it was when the sheet opened: applying clears the session before the sheet
  // has closed, and that shouldn't flash "no plan" on the way out
  const [proposal] = useState(() => {
    const { session } = useVoiceStore.getState();
    return session?.status === "proposed" ? session.proposal : null;
  });
  const changes = useMemo(() => proposal?.changes ?? [], [proposal]);
  const [off, setOff] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  const kept = changes.filter((_, i) => !off.has(i));
  const toggle = (i: number) =>
    setOff((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const apply = async () => {
    setBusy(true);
    try {
      const result = await useVoiceStore.getState().apply(kept);
      await SheetManager.hide(sheetId);
      if (result.skipped.length) {
        const lines = result.skipped.map((s) => `${describeChange(s.change, today).title}: ${s.why}`);
        Alert.alert(`Skipped ${result.skipped.length}`, lines.join("\n"));
      }
    } catch (e) {
      Alert.alert("Couldn't apply the plan", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const discard = () =>
    Alert.alert("Discard this plan?", "Nothing changes in Slate.", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: async () => {
          await useVoiceStore.getState().discard();
          SheetManager.hide(sheetId);
        },
      },
    ]);

  return (
    <Sheet id={sheetId}>
      <SheetHeader title="Your plan" eyebrow="From your call" sheetId={sheetId} />
      {!proposal ? (
        <View style={styles.body}>
          <ThemedText type="callout" tone="textSecondary">
            There&apos;s no plan waiting.
          </ThemedText>
        </View>
      ) : (
        <View style={styles.body}>
          <ThemedText type="body">{proposal.summary}</ThemedText>

          {changes.length ? (
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {changes.map((change, i) => {
                const line = describeChange(change, today);
                const on = !off.has(i);
                return (
                  <View key={i} style={[styles.row, { borderColor: colors.border, opacity: on ? 1 : 0.5 }]}>
                    <View style={styles.text}>
                      <ThemedText type="eyebrow" tone={change.kind === "delete" ? "error" : "primary"}>
                        {line.action}
                      </ThemedText>
                      <ThemedText type="bodySemiBold">{line.title}</ThemedText>
                      {line.detail && (
                        <ThemedText type="caption" tone="textSecondary">
                          {line.detail}
                        </ThemedText>
                      )}
                      {change.reason ? (
                        <ThemedText type="caption" tone="textTertiary">
                          {change.reason}
                        </ThemedText>
                      ) : null}
                    </View>
                    <Switch
                      value={on}
                      onValueChange={() => toggle(i)}
                      trackColor={{ true: colors.primary, false: colors.surfaceSunken }}
                      accessibilityLabel={`${line.action}: ${line.title}`}
                    />
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <ThemedText type="callout" tone="textSecondary">
              Nothing to change: the call didn&apos;t add up to any changes.
            </ThemedText>
          )}

          <View style={styles.buttons}>
            <Button title="Discard" variant="secondary" onPress={discard} style={styles.flex} />
            <Button
              title={changes.length ? `Apply ${kept.length}` : "Done"}
              icon="check"
              haptics="medium"
              loading={busy}
              disabled={changes.length > 0 && kept.length === 0}
              onPress={apply}
              style={styles.flex}
            />
          </View>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8, gap: 16 },
  list: { maxHeight: 420 },
  listContent: { gap: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1, gap: 2 },
  buttons: { flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
});
