import { StyleSheet, View } from "react-native";

import React from "react";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

interface TabHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export const TabHeader: React.FC<TabHeaderProps> = ({ title, children }) => {
  return (
    <ThemedView style={styles.header}>
      <View style={styles.headerTop}>
        <ThemedText type="title">{title}</ThemedText>
      </View>
      {children && <View style={styles.headerContent}>{children}</View>}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTop: {
    marginBottom: 15,
  },
  headerContent: {
    marginBottom: 15,
  },
});
