import { Sheet, SheetHeader } from "@/components/ui/Sheet";
import { SheetManager, SheetProps } from "react-native-actions-sheet";
import { ScrollView, StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { PressableScale } from "@/components/ui/PressableScale";
import { Radius } from "@/constants/theme";
import React from "react";
import { ThemedText } from "@/components/themed-text";
import { formatRelativeDay } from "@/lib/utils/dateFormat";
import { useAppStore } from "@/lib/stores/appStore";
import { useTheme } from "@/hooks/use-theme";
import { useTimeStore } from "@/lib/stores/timeStore";

type DependencyPickerModalProps = SheetProps<"dependency-picker-sheet">;

export default function DependencyPickerModal({
  sheetId,
  payload,
}: DependencyPickerModalProps) {
  const { colors } = useTheme();
  const today = useTimeStore((s) => s.currentDate);
  const { onDependencySelect, currentTaskId, selectedDependencyId } =
    payload || {};
  const { slateTasks } = useAppStore();

  // Get all tasks except the current one being edited
  const availableTasks = slateTasks.filter(
    (task) => task.id !== currentTaskId && task.status === "open"
  );

  const select = (taskId: string | null) => {
    onDependencySelect?.(taskId);
    SheetManager.hide(sheetId);
  };

  return (
    <Sheet id={sheetId}>
      <SheetHeader sheetId={sheetId} eyebrow="Depends on" title="Do this after…" />

      {availableTasks.length === 0 ? (
        <EmptyState
          compact
          art="tablet"
          title="Nothing to link to"
          body="Every other task is done. Add another one to the Slate first."
        />
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {availableTasks.map((task) => {
            const selected = selectedDependencyId === task.id;
            return (
              <PressableScale
                key={task.id}
                haptics="selection"
                scaleTo={0.98}
                onPress={() => select(task.id)}
                style={[
                  styles.row,
                  {
                    backgroundColor: selected ? colors.primarySoft : colors.surfaceSunken,
                  },
                ]}
              >
                <View style={styles.flex}>
                  <ThemedText type="bodyMedium" style={selected && { color: colors.primary }}>
                    {task.title}
                  </ThemedText>
                  {task.scheduledFor && (
                    <ThemedText type="caption" tone="textTertiary">
                      Planned for {formatRelativeDay(task.scheduledFor, today)}
                    </ThemedText>
                  )}
                </View>
                {selected && <Icon name="checkCircle" size={22} color="primary" weight="fill" />}
              </PressableScale>
            );
          })}
        </ScrollView>
      )}

      {selectedDependencyId && (
        <Button
          title="Remove link"
          icon="x"
          variant="ghost"
          size="md"
          onPress={() => select(null)}
          style={styles.clear}
        />
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: 420 },
  listContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: Radius.lg,
  },
  flex: { flex: 1, gap: 2 },
  clear: { alignSelf: "center", marginTop: 4 },
});
