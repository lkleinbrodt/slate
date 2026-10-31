import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import React, { useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { ThemedText } from "@/components/themed-text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVoiceStore } from "@/lib/stores/voiceStore";

// slate://voice: the plan-the-day call (docs/voice.md). Who you're talking to, the live
// transcript, mute and hang up; then "Making your plan…" until the plan is ready, when
// this closes and the review sheet opens (VoiceSessionWatcher). The call and the planning
// live in the voice store, so closing this screen mid-planning loses nothing.

export default function VoiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const session = useVoiceStore((s) => s.session);
  const callPhase = useVoiceStore((s) => s.callPhase);
  const messages = useVoiceStore((s) => s.messages);
  const muted = useVoiceStore((s) => s.muted);
  const scroll = useRef<ScrollView>(null);

  const who = name ?? (session?.character ? session.character[0].toUpperCase() + session.character.slice(1) : "your call");
  const status = session?.status;

  // Done here once there's a plan to review, or nothing left. The screen opens a moment
  // before the store has the session, so only once it has been seen.
  const seen = useRef(false);
  if (session) seen.current = true;
  useEffect(() => {
    if (seen.current && (!session || status === "proposed")) router.back();
  }, [session, status, router]);

  const live = callPhase !== null;
  const planning = !live && (status === "calling" || status === "ended" || status === "planning");
  const failed = status === "failed";

  const heading = live
    ? callPhase === "connecting"
      ? `Calling ${who}…`
      : `On a call with ${who}`
    : planning
    ? "Making your plan…"
    : failed
    ? "That didn't work"
    : "Starting…";

  const discard = async () => {
    await useVoiceStore.getState().discard();
  };

  return (
    <Screen>
      <View style={[styles.wrap, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
        <ThemedText type="greeting" tone="textSecondary">
          Plan your day
        </ThemedText>
        <ThemedText type="display">{heading}</ThemedText>
        {planning && <ActivityIndicator style={styles.spinner} />}
        {failed && session?.error && (
          <ThemedText type="callout" tone="error">
            {session.error}
          </ThemedText>
        )}

        <ScrollView
          ref={scroll}
          style={styles.flex}
          contentContainerStyle={styles.transcript}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        >
          {messages.filter(Boolean).map((m, i) => (
            <Card key={i} style={[m.role === "user" ? styles.mine : styles.theirs, !live && styles.dim]}>
              <ThemedText type="caption" tone="textTertiary">
                {m.role === "user" ? "You" : who}
                {m.interrupted ? " · cut off" : ""}
              </ThemedText>
              <ThemedText type="body">{m.text}</ThemedText>
            </Card>
          ))}
        </ScrollView>

        <View style={styles.buttons}>
          {live ? (
            <>
              <Button
                title={muted ? "Unmute" : "Mute"}
                icon="microphone"
                variant="secondary"
                onPress={() => useVoiceStore.getState().setMuted(!muted)}
                style={styles.flex}
              />
              <Button title="Hang up" icon="x" haptics="medium" onPress={() => useVoiceStore.getState().hangUp()} style={styles.flex} />
            </>
          ) : failed ? (
            <>
              <Button title="Discard" variant="secondary" onPress={discard} style={styles.flex} />
              <Button title="Try again" icon="repeat" haptics="medium" onPress={() => useVoiceStore.getState().retry()} style={styles.flex} />
            </>
          ) : (
            <Button title="Close" variant="secondary" onPress={() => router.back()} style={styles.flex} />
          )}
        </View>
        {planning && (
          <ThemedText type="caption" tone="textTertiary" style={styles.note}>
            You can close this; the plan will be waiting on Today.
          </ThemedText>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 20, gap: 12 },
  flex: { flex: 1 },
  spinner: { alignSelf: "flex-start" },
  transcript: { gap: 10, paddingVertical: 8 },
  mine: { marginLeft: 32 },
  theirs: { marginRight: 32 },
  dim: { opacity: 0.7 },
  buttons: { flexDirection: "row", gap: 12 },
  note: { textAlign: "center" },
});
