import { ScrollView, StyleSheet, View } from "react-native";
import { type CallMessage, type ThreepioCharacter, threepioClient } from "@/lib/voice/threepio";
import { type CallPhase, VoiceCall } from "@/lib/voice/call";
import { GREETING_PROMPT, buildInstructions } from "@/lib/voice/planDay/instructions";
import React, { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { ThemedText } from "@/components/themed-text";
import { buildDaySnapshot } from "@/lib/voice/planDay/snapshot";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsStore } from "@/lib/stores/settings";
import { useTimeStore } from "@/lib/stores/timeStore";

// slate://voice: a bare plan-the-day call, step 3 of docs/voice.md. It proves the native
// pieces (mic, WebRTC to Threepio, background audio) and that the transcript comes back;
// step 4 replaces it with the real flow (start sheet, review, apply).

type Saved = { kind: "waiting" } | { kind: "ok"; lines: number; cost: number | null } | { kind: "error"; message: string };

export default function VoiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const threepioUrl = useSettingsStore((s) => s.threepioUrl);
  const [character, setCharacter] = useState<ThreepioCharacter | null>(null);
  const [phase, setPhase] = useState<CallPhase | "idle">("idle");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<CallMessage[]>([]);
  const [muted, setMuted] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const call = useRef<VoiceCall | null>(null);

  useEffect(() => {
    threepioClient(threepioUrl)
      .characters()
      .then((list) => setCharacter(list.find((c) => c.default) ?? list[0] ?? null))
      .catch((e) => setError(e.message));
  }, [threepioUrl]);

  // Hang up if the screen goes away mid-call
  useEffect(() => () => void call.current?.hangUp(), []);

  const start = async () => {
    if (!character) return;
    const threepio = threepioClient(threepioUrl);
    const date = useTimeStore.getState().getCurrentDate();
    setMessages([]);
    setError(null);
    setSaved(null);
    const snapshot = await buildDaySnapshot(date);
    const voiceCall = new VoiceCall(threepio, {
      onPhase: (p, err) => {
        setPhase(p);
        if (err) setError(err);
        if (p === "ended" || p === "failed") fetchTranscript(voiceCall);
      },
      onMessage: (index, message) =>
        setMessages((m) => {
          const next = [...m];
          next[index] = message;
          return next;
        }),
    });
    call.current = voiceCall;
    await voiceCall.start({
      instructions: buildInstructions(snapshot),
      character: character.id,
      greeting: { prompt: GREETING_PROMPT },
      local_date: date,
      app: "slate",
      metadata: { test: "step 3" },
    });
  };

  // Threepio closes the recording a moment after the call; the cost follows ~10 s later
  const fetchTranscript = async (voiceCall: VoiceCall) => {
    if (!voiceCall.callId) return;
    setSaved({ kind: "waiting" });
    const threepio = threepioClient(threepioUrl);
    for (let i = 0; i < 15; i++) {
      try {
        const c = await threepio.call(voiceCall.callId);
        if (c.status === "ended" && (c.cost_usd !== null || i >= 12)) {
          setSaved({ kind: "ok", lines: c.messages.length, cost: c.cost_usd });
          return;
        }
      } catch (e) {
        setSaved({ kind: "error", message: e instanceof Error ? e.message : String(e) });
        return;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  };

  const live = phase === "connecting" || phase === "live";
  const status =
    phase === "connecting" ? "Connecting…" : phase === "live" ? `On a call with ${character?.name}` : phase === "ended" ? "Call ended" : phase === "failed" ? "Call failed" : character ? `Plan your day with ${character.name}` : "Finding who to call…";

  return (
    <Screen>
      <View style={[styles.wrap, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
        <ThemedText type="greeting" tone="textSecondary">
          Voice (test)
        </ThemedText>
        <ThemedText type="display">{status}</ThemedText>
        {error && (
          <ThemedText type="callout" tone="error">
            {error}
          </ThemedText>
        )}

        <ScrollView style={styles.flex} contentContainerStyle={styles.transcript}>
          {messages.filter(Boolean).map((m, i) => (
            <Card key={i} style={m.role === "user" ? styles.mine : undefined}>
              <ThemedText type="caption" tone="textTertiary">
                {m.role === "user" ? "You" : character?.name}
                {m.interrupted ? " · cut off" : ""}
              </ThemedText>
              <ThemedText type="body">{m.text}</ThemedText>
            </Card>
          ))}
          {saved && (
            <ThemedText type="callout" tone={saved.kind === "error" ? "error" : "textSecondary"}>
              {saved.kind === "waiting"
                ? "Fetching the transcript from Threepio…"
                : saved.kind === "ok"
                ? `Transcript back from Threepio: ${saved.lines} lines${saved.cost !== null ? `, $${saved.cost.toFixed(3)}` : ""}.`
                : saved.message}
            </ThemedText>
          )}
        </ScrollView>

        <View style={styles.buttons}>
          {live ? (
            <>
              <Button
                title={muted ? "Unmute" : "Mute"}
                variant="secondary"
                onPress={() => {
                  call.current?.setMuted(!muted);
                  setMuted(!muted);
                }}
              />
              <Button title="Hang up" icon="x" haptics="medium" onPress={() => call.current?.hangUp()} />
            </>
          ) : (
            <>
              <Button title="Close" variant="secondary" onPress={() => router.back()} />
              <Button title="Call" icon="microphone" haptics="medium" disabled={!character} onPress={start} />
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 20, gap: 12 },
  flex: { flex: 1 },
  transcript: { gap: 10, paddingVertical: 8 },
  mine: { marginLeft: 32 },
  buttons: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
});
