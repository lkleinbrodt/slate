import { Platform, useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === "ios" ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === "ios" ? 90 : 70,
        },
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="today" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Slate",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="slate" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

// Minimalist icon component using Ionicons
function TabBarIcon({
  name,
  color,
  size,
}: {
  name: string;
  color: string;
  size: number;
}) {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    today: "checkmark-circle-outline",
    slate: "list-outline",
    calendar: "calendar-outline",
    settings: "settings-outline",
  };

  return (
    <Ionicons
      name={iconMap[name] || "help-outline"}
      size={size}
      color={color}
    />
  );
}
