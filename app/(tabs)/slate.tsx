import { ScrollView, StyleSheet, View } from "react-native";

import React from "react";
import { PlanWithVoiceButton } from "@/components/voice/PlanWithVoiceButton";
import { Screen } from "@/components/ui/Screen";
import { SheetManager } from "react-native-actions-sheet";
import { SlateSection } from "@/components/planner";
import { ThemedText } from "@/components/themed-text";
import { useAppStore } from "@/lib/stores/appStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTabBarSpace } from "@/components/TabBar";

export default function SlateScreen() {
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const { slateTasks, planTaskForToday } = useAppStore();

  const handleOpenAddModal = () => {
    SheetManager.show("add-edit-modal", {
      payload: { mode: "add", type: "task" },
    });
  };

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: bottomSpace }}
      >
        <View style={styles.header}>
          <ThemedText type="greeting" tone="textSecondary">
            Everything, someday
          </ThemedText>
          <ThemedText type="display">Slate</ThemedText>
          <ThemedText type="eyebrow" tone="textTertiary" style={styles.count}>
            {slateTasks.length} open task{slateTasks.length === 1 ? "" : "s"}
          </ThemedText>
          <PlanWithVoiceButton style={styles.voice} />
        </View>

        <View style={styles.content}>
          <SlateSection
            tasks={slateTasks}
            onAddToToday={(type, id) => planTaskForToday(id)}
            onAdd={handleOpenAddModal}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  count: { marginTop: 6 },
  voice: { marginTop: 16 },
  content: { paddingHorizontal: 16 },
});
