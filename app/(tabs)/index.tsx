import { ScrollView, StyleSheet, View } from "react-native";

import { AddButton } from "@/components/AddButton";
import { SlateSection } from "@/components/planner";
import { SafeAreaThemedView } from "@/components/safe-area-themed-view";
import { TabHeader } from "@/components/shared/TabHeader";
import { useAppStore } from "@/lib/stores/appStore";
import React from "react";

export default function SlateScreen() {
  const { slateTasks, planTaskForToday, createTask } = useAppStore();

  // Modal logic would be re-introduced here
  const handleOpenAddModal = () => {
    // For now, let's just add a placeholder task
    const title = `New Slate Task ${Date.now()}`;
    createTask({ title });
  };

  return (
    <SafeAreaThemedView style={styles.container}>
      <ScrollView>
        <TabHeader title="Slate">
          <View style={{ alignItems: "flex-end" }}>
            <AddButton onPress={handleOpenAddModal} />
          </View>
        </TabHeader>

        <SlateSection
          tasks={slateTasks}
          onAddToToday={(type, id) => planTaskForToday(id)}
          onEdit={() => {}}
        />
      </ScrollView>
    </SafeAreaThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
