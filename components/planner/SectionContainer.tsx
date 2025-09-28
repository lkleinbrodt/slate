import { StyleSheet, View } from "react-native";

import React from "react";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { UI } from "@/lib/constants/app";
import { useThemeColor } from "@/hooks/use-theme-color";

interface SectionContainerProps {
  title: string;
  subtitle: string;
  backgroundColor?: string;
  titleColor?: string;
  borderColor?: string;
  children: React.ReactNode;
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  title,
  subtitle,
  backgroundColor,
  titleColor,
  borderColor,
  children,
}) => {
  const defaultBackgroundColor = useThemeColor({}, "backgroundSecondary");
  const defaultTitleColor = useThemeColor({}, "text");
  const defaultBorderColor = useThemeColor({}, "border");

  return (
    <ThemedView
      style={[
        styles.section,
        { backgroundColor: backgroundColor || defaultBackgroundColor },
      ]}
    >
      {/* Section Header */}
      <View
        style={[
          styles.sectionHeader,
          { borderBottomColor: borderColor || defaultBorderColor },
        ]}
      >
        <ThemedText
          type="h4"
          style={[
            styles.sectionTitle,
            { color: titleColor || defaultTitleColor },
          ]}
        >
          {title}
        </ThemedText>
        <ThemedText type="caption" style={styles.sectionSubtitle}>
          {subtitle}
        </ThemedText>
      </View>

      {children}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: UI.SPACING.LG,
    paddingTop: UI.SPACING.MD,
    marginBottom: UI.SPACING.LG,
    borderRadius: UI.BORDER_RADIUS.LG,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: UI.SPACING.SM,
    borderBottomWidth: 2,
  },
  sectionTitle: {
    flex: 1,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    marginTop: 2,
    opacity: 0.8,
    fontWeight: "600",
  },
});
