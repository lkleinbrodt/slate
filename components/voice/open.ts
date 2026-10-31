import { SheetManager } from "react-native-actions-sheet";
import { router } from "expo-router";
import { useVoiceStore } from "@/lib/stores/voiceStore";

/** "Plan with voice": start a call, or go back to the session already under way. */
export function openVoicePlanning() {
  const session = useVoiceStore.getState().session;
  if (!session) {
    SheetManager.show("voice-start");
  } else if (session.status === "proposed") {
    SheetManager.show("voice-review");
  } else {
    router.push("/voice");
  }
}
