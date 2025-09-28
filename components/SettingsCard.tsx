import { StyleSheet, View } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import { UI } from "@/lib/constants/app";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

interface SettingsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  icon,
  title,
  children,
}) => {
  const backgroundColor = useThemeColor({}, "backgroundSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const borderColor = useThemeColor({}, "border");

  return (
    <ThemedView style={[styles.card, { borderColor }]}>
      <View style={[styles.header, { backgroundColor }]}>
        <View style={[styles.iconContainer, { backgroundColor: primaryColor }]}>
          <Ionicons name={icon} size={20} color="white" />
        </View>
        <ThemedText type="h4" style={styles.title}>
          {title}
        </ThemedText>
      </View>
      <View style={styles.content}>{children}</View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: UI.BORDER_RADIUS.LG,
    borderWidth: 1,
    marginBottom: UI.SPACING.LG,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: UI.SPACING.MD,
    gap: UI.SPACING.SM,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
  },
  content: {
    padding: UI.SPACING.MD,
  },
});
