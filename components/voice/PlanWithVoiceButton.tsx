import { Button } from "@/components/ui/Button";
import React from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { openVoicePlanning } from "./open";
import { useVoiceStore } from "@/lib/stores/voiceStore";

/** On Today and the Slate. Says where an unfinished session is, so it's easy to go back to. */
export function PlanWithVoiceButton({ style }: { style?: StyleProp<ViewStyle> }) {
  const status = useVoiceStore((s) => s.session?.status);
  const title =
    status === "proposed"
      ? "Review your plan"
      : status === "failed"
      ? "Voice plan: needs a look"
      : status
      ? "Back to your call"
      : "Plan with voice";
  return (
    <Button
      title={title}
      icon={status === "proposed" ? "listChecks" : "microphone"}
      variant={status ? "primary" : "secondary"}
      size="md"
      haptics="medium"
      onPress={openVoicePlanning}
      style={[{ alignSelf: "flex-start" }, style]}
    />
  );
}
