// Before a voice call: who to call (last one used, tap to change) and a Call button.
// A missing OpenRouter key is caught here, before the call, not after it.
import { type ThreepioCharacter, threepioClient } from "@/lib/voice/threepio";
import React, { useEffect, useState } from "react";
import { Sheet, SheetHeader } from "@/components/ui/Sheet";
import { SheetManager, type SheetProps } from "react-native-actions-sheet";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ThemedText } from "@/components/themed-text";
import { getOpenRouterKey } from "@/lib/voice/secrets";
import { router } from "expo-router";
import { useSettingsStore } from "@/lib/stores/settings";
import { useVoiceStore } from "@/lib/stores/voiceStore";

type Load =
  | { kind: "loading" }
  | { kind: "ready"; characters: ThreepioCharacter[]; keySet: boolean }
  | { kind: "error"; message: string };

export default function StartSheet({ sheetId }: SheetProps<"voice-start">) {
  const threepioUrl = useSettingsStore((s) => s.threepioUrl);
  const lastCharacter = useSettingsStore((s) => s.voiceCharacter);
  const updateVoiceCharacter = useSettingsStore((s) => s.updateVoiceCharacter);
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([threepioClient(threepioUrl).characters(), getOpenRouterKey().catch(() => null)])
      .then(([characters, key]) => {
        if (!live) return;
        setLoad({ kind: "ready", characters, keySet: !!key });
        const last = characters.find((c) => c.id === lastCharacter);
        setPicked((last ?? characters.find((c) => c.default) ?? characters[0])?.id ?? null);
      })
      .catch((e) => live && setLoad({ kind: "error", message: e instanceof Error ? e.message : String(e) }));
    return () => {
      live = false;
    };
  }, [threepioUrl, lastCharacter]);

  const character = load.kind === "ready" ? load.characters.find((c) => c.id === picked) : undefined;

  const call = async () => {
    if (!character) return;
    await SheetManager.hide(sheetId);
    void updateVoiceCharacter(character.id);
    void useVoiceStore.getState().startCall(character.id);
    router.push({ pathname: "/voice", params: { name: character.name } });
  };

  const openSettings = async () => {
    await SheetManager.hide(sheetId);
    router.push("/settings");
  };

  return (
    <Sheet id={sheetId}>
      <SheetHeader title={character ? `Plan with ${character.name}` : "Plan with voice"} eyebrow="Voice" sheetId={sheetId} />
      <View style={styles.body}>
        <ThemedText type="callout" tone="textSecondary">
          Talk your day through for a few minutes. When you hang up, Slate makes a plan for you to check.
        </ThemedText>

        {load.kind === "loading" && <ActivityIndicator style={styles.loading} />}

        {load.kind === "error" && (
          <ThemedText type="callout" tone="error">
            {load.message}
          </ThemedText>
        )}

        {load.kind === "ready" && load.characters.length > 1 && (
          <View style={styles.chips}>
            {load.characters.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                size="md"
                tone={c.id === picked ? "primary" : "neutral"}
                filled={c.id === picked}
                onPress={() => setPicked(c.id)}
              />
            ))}
          </View>
        )}

        {load.kind === "ready" && !load.characters.length && (
          <ThemedText type="callout" tone="error">
            Threepio offers no characters to Slate.
          </ThemedText>
        )}

        {load.kind === "ready" && !load.keySet ? (
          <>
            <ThemedText type="callout" tone="error">
              Slate needs your OpenRouter key to turn the call into a plan. Add it in Settings → Voice first.
            </ThemedText>
            <Button title="Open Settings" icon="gear" variant="secondary" onPress={openSettings} />
          </>
        ) : (
          <Button title="Call" icon="microphone" haptics="medium" disabled={!character} onPress={call} />
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8, gap: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  loading: { paddingVertical: 12 },
});
