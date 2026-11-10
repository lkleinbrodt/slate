import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SheetManager, SheetProps } from "react-native-actions-sheet";

import { Button } from "@/components/ui/Button";
import { Sheet, SheetHeader } from "@/components/ui/Sheet";
import { DEFAULT_DURATION } from "@/lib/logic/schedule";
import { useAppStore } from "@/lib/stores/appStore";
import { ScheduleOptions, type SlotChoice, resolveSlot, useSuggestions } from "./ScheduleOptions";

/** Set, move or clear one of today's tasks' time slot */
export default function ScheduleSheet({ sheetId, payload }: SheetProps<"schedule-sheet">) {
  const task = useAppStore((s) => s.todayTasks.find((t) => t.id === payload?.taskId));
  const scheduleTask = useAppStore((s) => s.scheduleTask);
  const [duration, setDuration] = useState(task?.durationMin ?? DEFAULT_DURATION);
  const [choice, setChoice] = useState<SlotChoice>(
    task?.startTime ? { at: task.startTime } : "next"
  );
  const suggestions = useSuggestions(duration, task?.id);

  if (!task) return null;

  const save = async () => {
    await scheduleTask(task.id, resolveSlot(choice, suggestions), duration);
    SheetManager.hide(sheetId);
  };

  return (
    <Sheet id={sheetId}>
      <SheetHeader sheetId={sheetId} eyebrow={task.title} title="When will you do it?" />
      <View style={styles.content}>
        <ScheduleOptions
          duration={duration}
          onDurationChange={setDuration}
          choice={choice}
          onChoiceChange={setChoice}
          suggestions={suggestions}
        />
        <Button title="Save" icon="check" onPress={save} haptics="medium" />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 20 },
});
