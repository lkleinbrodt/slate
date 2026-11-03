import { StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/Button";
import React from "react";
import { Screen } from "@/components/ui/Screen";
import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** expo-router's ErrorBoundary for a screen: what went wrong, Try again, and a way out.
 * Without one, a render error leaves a blank screen the user can't leave. */
export function ScreenErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  const insets = useSafeAreaInsets();
  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };
  return (
    <Screen>
      <View style={[styles.wrap, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
        <ThemedText type="display">Something went wrong</ThemedText>
        <ThemedText type="callout" tone="textSecondary">
          {error.message || String(error)}
        </ThemedText>
        <View style={styles.buttons}>
          <Button title="Close" variant="secondary" onPress={leave} style={styles.flex} />
          <Button title="Try again" icon="repeat" onPress={() => void retry()} style={styles.flex} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 20, gap: 16 },
  buttons: { flexDirection: "row", gap: 12, marginTop: "auto" },
  flex: { flex: 1 },
});
