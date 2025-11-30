import "react-native-reanimated";
import "../sheets";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { ToastProvider } from "@/components/ToastProvider";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { initializeDatabase } from "@/lib/db/connection";
import { getNotificationPermissionStatus, rescheduleAllNotifications } from "@/lib/services/notifications";
import { useAppStore } from "@/lib/stores/appStore";
import { useSettingsStore } from "@/lib/stores/settings";
import { useTimeStore } from "@/lib/stores/timeStore";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SheetProvider } from "react-native-actions-sheet";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loadSettings } = useSettingsStore();
  const { init: initAppStore } = useAppStore();
  const { initialize: initTimeStore } = useTimeStore();

  useEffect(() => {
    let cleanupTimeStore: (() => void) | undefined;

    const initialize = async () => {
      try {
        await initializeDatabase();
        await loadSettings();

        // Initialize TimeStore first - it will handle date tracking and rollover
        cleanupTimeStore = initTimeStore();

        // Initialize app store (which now uses TimeStore for current date)
        await initAppStore();

        // Check notification permission status and reschedule notifications
        const permissionStatus = await getNotificationPermissionStatus();
        useSettingsStore.getState().setNotificationPermissionStatus(permissionStatus);
        if (permissionStatus === "granted") {
          await rescheduleAllNotifications();
        }

        setIsReady(true);
      } catch (e) {
        console.error("Initialization failed:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
      }
    };
    
    initialize();
    
    // Cleanup on unmount
    return () => {
      if (cleanupTimeStore) {
        cleanupTimeStore();
      }
    };
  }, [loadSettings, initAppStore, initTimeStore]);

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
      <ToastProvider>
        <SheetProvider>
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
        </SheetProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
