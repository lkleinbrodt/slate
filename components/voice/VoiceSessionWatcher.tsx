import { useEffect } from "react";
import { SheetManager } from "react-native-actions-sheet";
import { useVoiceStore } from "@/lib/stores/voiceStore";

// Mounted once at the root. On launch it picks up an unfinished voice session (a crash or a
// killed app mid-call or mid-plan), and whenever a plan becomes ready it opens the review.
// The wait lets the call screen close first, and the sheet provider attach on a cold start.
const OPEN_DELAY_MS = 450;

export function VoiceSessionWatcher() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useVoiceStore.subscribe((state, prev) => {
      const ready = state.session?.status === "proposed";
      const wasReady = prev.session?.status === "proposed" && prev.session.id === state.session?.id;
      if (ready && !wasReady) {
        clearTimeout(timer);
        timer = setTimeout(() => SheetManager.show("voice-review"), OPEN_DELAY_MS);
      }
    });
    useVoiceStore
      .getState()
      .resume()
      .catch((e) => console.error("[voice] resume failed:", e));
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);
  return null;
}
