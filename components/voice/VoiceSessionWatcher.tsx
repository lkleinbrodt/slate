import { AppState } from "react-native";
import { dismissVoicePlanReady, notifyVoicePlanReady } from "@/lib/services/notifications";
import { useEffect } from "react";
import { SheetManager } from "react-native-actions-sheet";
import { useVoiceStore } from "@/lib/stores/voiceStore";

// Mounted once at the root. On launch it picks up an unfinished voice session (a crash or a
// killed app mid-call or mid-plan), and whenever a plan becomes ready it opens the review.
// With Slate in the background (the call ended from his pocket) it sends a notification
// instead, and opens the review when he comes back. The wait lets the call screen close
// first, and the sheet provider attach on a cold start.
const OPEN_DELAY_MS = 450;

export function VoiceSessionWatcher() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let reviewWaiting = false;

    const openReview = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (useVoiceStore.getState().session?.status !== "proposed") return;
        SheetManager.show("voice-review");
        void dismissVoicePlanReady();
      }, OPEN_DELAY_MS);
    };

    const unsubscribe = useVoiceStore.subscribe((state, prev) => {
      const ready = state.session?.status === "proposed";
      const wasReady = prev.session?.status === "proposed" && prev.session.id === state.session?.id;
      if (!ready || wasReady) return;
      if (AppState.currentState === "active") {
        openReview();
      } else {
        reviewWaiting = true;
        notifyVoicePlanReady(state.session?.proposal?.summary ?? "").catch((e) =>
          console.error("[voice] plan-ready notification failed:", e)
        );
      }
    });
    const appState = AppState.addEventListener("change", (next) => {
      if (next === "active" && reviewWaiting) {
        reviewWaiting = false;
        openReview();
      }
    });

    useVoiceStore
      .getState()
      .resume()
      .catch((e) => console.error("[voice] resume failed:", e));
    return () => {
      unsubscribe();
      appState.remove();
      clearTimeout(timer);
    };
  }, []);
  return null;
}
