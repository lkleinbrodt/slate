import { Alert, Pressable, StyleSheet, View } from "react-native";
import React, { useState } from "react";
import { ThreepioError, threepioClient } from "@/lib/voice/threepio";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Radius } from "@/constants/theme";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ThemedText } from "@/components/themed-text";
import { useSettingsStore } from "@/lib/stores/settings";
import { useTheme } from "@/hooks/use-theme";

type TestState =
  | { kind: "idle" }
  | { kind: "testing" }
  | { kind: "ok"; characters: string[] }
  | { kind: "error"; message: string };

/** Where Threepio, the voice service, is, and a check that the phone can reach it (docs/voice.md) */
export function VoiceSettings() {
  const { colors } = useTheme();
  const threepioUrl = useSettingsStore((s) => s.threepioUrl);
  const updateThreepioUrl = useSettingsStore((s) => s.updateThreepioUrl);
  const [test, setTest] = useState<TestState>({ kind: "idle" });

  const editUrl = () =>
    Alert.prompt(
      "Threepio address",
      "The voice service on chewy. Your phone reaches it over Tailscale.",
      async (value) => {
        const url = value.trim().replace(/\/+$/, "");
        if (!/^https?:\/\/\S+$/.test(url)) {
          Alert.alert("That's not an address", "It should start with https://");
          return;
        }
        await updateThreepioUrl(url);
        setTest({ kind: "idle" });
      },
      "plain-text",
      threepioUrl,
      "url"
    );

  const testConnection = async () => {
    setTest({ kind: "testing" });
    try {
      const characters = await threepioClient(threepioUrl).characters();
      setTest({ kind: "ok", characters: characters.map((c) => c.name) });
    } catch (e) {
      setTest({ kind: "error", message: e instanceof ThreepioError ? e.message : String(e) });
    }
  };

  const status =
    test.kind === "ok"
      ? {
          text: test.characters.length
            ? `Connected · ${test.characters.join(", ")}`
            : "Connected, but Threepio offers no characters to Slate.",
          tone: colors.habit,
        }
      : test.kind === "error"
      ? { text: test.message, tone: colors.error }
      : null;

  return (
    <View style={styles.wrap}>
      <SectionHeader title="Voice" />
      <Card padded={false} clip>
        <Pressable onPress={editUrl} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
            <Icon name="microphone" size={20} color="primary" weight="duotone" duotoneOpacity={0.35} />
          </View>
          <View style={styles.flex}>
            <ThemedText type="bodySemiBold">Threepio</ThemedText>
            <ThemedText type="caption" tone="textSecondary" numberOfLines={1}>
              {threepioUrl}
            </ThemedText>
          </View>
          <Icon name="pencil" size={18} color="textTertiary" />
        </Pressable>

        <View style={[styles.testBox, { backgroundColor: colors.surfaceSunken }]}>
          {status && (
            <ThemedText type="callout" style={{ color: status.tone }}>
              {status.text}
            </ThemedText>
          )}
          <Button
            title="Test connection"
            icon="link"
            variant="secondary"
            size="md"
            loading={test.kind === "testing"}
            onPress={testConnection}
          />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  pressed: { opacity: 0.6 },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: { flex: 1, gap: 2 },
  testBox: { padding: 16, gap: 12, alignItems: "flex-start" },
});
