import "react-native-reanimated";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, AppState, Text, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { initializeDatabase } from "@/lib/db/connection";
import { getToday } from "@/lib/logic/dates";
import { processRollover } from "@/lib/logic/rollover";
import { useAppStore } from "@/lib/stores/appStore";
import { useSettingsStore } from "@/lib/stores/settings";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { dayStart, loadSettings } = useSettingsStore();
  const { init: initAppStore } = useAppStore();

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeDatabase();
        await loadSettings();

        // This needs to be called after settings are loaded
        const today = getToday(useSettingsStore.getState().dayStart);
        await processRollover(today);

        await initAppStore();
        setIsReady(true);
      } catch (e) {
        console.error("Initialization failed:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
      }
    };
    initialize();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        console.log(
          "App became active, re-checking rollover and refreshing data."
        );
        const today = getToday(useSettingsStore.getState().dayStart);
        processRollover(today).then(() => useAppStore.getState().refreshData());
      }
    });
    return () => sub.remove();
  }, [loadSettings, initAppStore]);

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text>Failed to initialize app</Text>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text>Loading Slate...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ActionSheetProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ActionSheetProvider>
    </SafeAreaProvider>
  );
}
