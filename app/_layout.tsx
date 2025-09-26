import "react-native-reanimated";

import { ActivityIndicator, AppState, Text, View } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { initializeApp, isAppReady } from "@/lib/app/init";
import { useEffect, useState } from "react";

import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSlateStore } from "@/lib/stores/slateStore";

export const unstable_settings = {
  anchor: "index",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const takeSnapshot = useSlateStore((s) => s.actions.takeSnapshot);

  useEffect(() => {
    initializeApp()
      .then(() => setIsInitialized(true))
      .catch((error) => {
        console.error("App initialization failed:", error);
        setInitError(error.message);
      });
    const sub = AppState.addEventListener("change", (state) => {
      if (/inactive|background/.test(state)) {
        takeSnapshot();
      }
    });
    return () => sub.remove();
  }, []);

  if (initError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 18, marginBottom: 10, textAlign: "center" }}>
          Failed to initialize app
        </Text>
        <Text style={{ color: "red", textAlign: "center" }}>{initError}</Text>
      </View>
    );
  }

  if (!isInitialized || !isAppReady()) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, fontSize: 16 }}>Loading Slate...</Text>
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
