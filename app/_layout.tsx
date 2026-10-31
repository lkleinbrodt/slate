import "react-native-reanimated";
import "../sheets";

import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import {
  Fraunces_400Regular_Italic,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { getNotificationPermissionStatus, rescheduleAllNotifications } from "@/lib/services/notifications";
import { useEffect, useState } from "react";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SheetProvider } from "react-native-actions-sheet";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { VoiceSessionWatcher } from "@/components/voice/VoiceSessionWatcher";
import { initializeDatabase } from "@/lib/db/connection";
import { startWidgetSync } from "@/lib/services/widget";
import { useAppStore } from "@/lib/stores/appStore";
import { useFonts } from "expo-font";
import { useSettingsStore } from "@/lib/stores/settings";
import { useTheme } from "@/hooks/use-theme";
import { useTimeStore } from "@/lib/stores/timeStore";

// Keep the splash up until fonts and the database are ready
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loadSettings } = useSettingsStore();
  const { init: initAppStore } = useAppStore();
  const { initialize: initTimeStore } = useTimeStore();
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Fraunces_400Regular_Italic,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });
  // A font that fails to load falls back to the system font; don't block on it
  const fontsDone = fontsLoaded || !!fontError;

  useEffect(() => {
    let cleanupTimeStore: (() => void) | undefined;
    let stopWidgetSync: (() => void) | undefined;

    const initialize = async () => {
      try {
        await initializeDatabase();
        await loadSettings();

        // Initialize TimeStore first - it will handle date tracking and rollover
        cleanupTimeStore = await initTimeStore();

        // Initialize app store (which now uses TimeStore for current date)
        await initAppStore();

        // Mirror Today into the home/lock screen widget from here on
        stopWidgetSync = startWidgetSync();

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
      stopWidgetSync?.();
    };
  }, [loadSettings, initAppStore, initTimeStore]);

  useEffect(() => {
    if ((isReady && fontsDone) || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady, fontsDone, error]);

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          gap: 8,
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 17, fontWeight: "600" }}>
          Slate couldn&apos;t start
        </Text>
        <Text style={{ color: colors.error, textAlign: "center" }}>{error}</Text>
      </View>
    );
  }

  if (!isReady || !fontsDone) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const navTheme = isDark ? DarkTheme : DefaultTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SheetProvider>
          <ThemeProvider
            value={{
              ...navTheme,
              colors: {
                ...navTheme.colors,
                background: colors.background,
                card: colors.surface,
                text: colors.text,
                border: colors.border,
                primary: colors.primary,
              },
            }}
          >
            <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: "none" }} />
              <Stack.Screen name="add" options={{ headerShown: false, animation: "none" }} />
              <Stack.Screen name="voice" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            </Stack>
            <VoiceSessionWatcher />
            <StatusBar style={isDark ? "light" : "dark"} />
          </ThemeProvider>
        </SheetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
