import { ScrollView, StyleSheet } from "react-native";

import { FloatingActionButton } from "@/components/FloatingActionButton";
import React from "react";
import { SafeAreaThemedView } from "@/components/safe-area-themed-view";
import { SheetManager } from "react-native-actions-sheet";
import { SlateSection } from "@/components/planner";
import { TabHeader } from "@/components/shared/TabHeader";
import { useAppStore } from "@/lib/stores/appStore";
import { useSettingsStore } from "@/lib/stores/settings";

export default function SlateScreen() {
  const { slateTasks, planTaskForToday } = useAppStore();
  const { dayStart } = useSettingsStore();

  const handleOpenAddModal = () => {
    SheetManager.show("add-edit-modal", {
      payload: { mode: "add", type: "task" },
    });
  };

  return (
    <SafeAreaThemedView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <TabHeader title="Slate" />

        <SlateSection
          tasks={slateTasks}
          onAddToToday={(type, id) => planTaskForToday(id)}
          dayStart={dayStart}
        />
      </ScrollView>

      <FloatingActionButton onPress={handleOpenAddModal} />
    </SafeAreaThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
