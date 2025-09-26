import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          paddingBottom: Platform.OS === "ios" ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === "ios" ? 90 : 70,
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#6b7280",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Your Slate",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="list" color={color} size={size} />
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
    list: "list-outline",
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
