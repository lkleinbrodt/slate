import * as Notifications from "expo-notifications";

import { AppState } from "react-native";
import {
  VOICE_PLAN_READY_ID,
  dismissVoicePlanReady,
  notifyVoicePlanReady,
} from "@/lib/services/notifications";
import { useEffect } from "react";
import { SheetManager } from "react-native-actions-sheet";
import { useVoiceStore } from "@/lib/stores/voiceStore";
import { whenCallScreenClosed } from "@/lib/voice/callScreen";

// Mounted once at the root. On launch it picks up an unfinished voice session (a crash or a
// killed app mid-call or mid-plan), and whenever a plan becomes ready it opens the review.
// With Slate in the background (the call ended from his pocket) it sends a notification
// instead, and opens the review when he comes back (by the notification or otherwise).
// The review only opens with Slate in the foreground and the call screen fully closed: a
// sheet presented over a closing full-screen modal left a black screen (2026-11-09). The
// extra wait lets the sheet provider attach on a cold start.
const OPEN_DELAY_MS = 450;

export function VoiceSessionWatcher() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    let reviewWaiting = false;

    const openReview = async () => {
      const mine = ++attempt;
      clearTimeout(timer);
      await whenCallScreenClosed();
      if (mine !== attempt) return;
      timer = setTimeout(() => {
        if (mine !== attempt) return;
        if (AppState.currentState !== "active") {
          reviewWaiting = true;
          return;
        }
        if (useVoiceStore.getState().session?.status !== "proposed") return;
        SheetManager.show("voice-review");
        void dismissVoicePlanReady();
      }, OPEN_DELAY_MS);
    };

    const openIfWaiting = () => {
      if (!reviewWaiting) return;
      reviewWaiting = false;
      void openReview();
    };

    const unsubscribe = useVoiceStore.subscribe((state, prev) => {
      const ready = state.session?.status === "proposed";
      const wasReady = prev.session?.status === "proposed" && prev.session.id === state.session?.id;
      if (!ready || wasReady) return;
      if (AppState.currentState === "active") {
        void openReview();
      } else {
        reviewWaiting = true;
        notifyVoicePlanReady(state.session?.proposal?.summary ?? "").catch((e) =>
          console.error("[voice] plan-ready notification failed:", e)
        );
      }
    });
    const appState = AppState.addEventListener("change", (next) => {
      if (next === "active") openIfWaiting();
    });
    // Tapping "Your plan is ready" also brings Slate forward; whichever comes first opens it
    const tap = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.notification.request.identifier === VOICE_PLAN_READY_ID) openIfWaiting();
    });

    useVoiceStore
      .getState()
      .resume()
      .catch((e) => console.error("[voice] resume failed:", e));
    return () => {
      unsubscribe();
      appState.remove();
      tap.remove();
      clearTimeout(timer);
      attempt++;
    };
  }, []);
  return null;
}
