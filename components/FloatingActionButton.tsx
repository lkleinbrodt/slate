import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { AddButtonProps } from "./types";
import React from "react";
import { useThemeColor } from "@/hooks/use-theme-color";

export const FloatingActionButton: React.FC<AddButtonProps> = ({ onPress }) => {
  const backgroundColor = useThemeColor({}, "tint");

  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.fabText}>+</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  fabText: {
    color: "white",
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 28,
  },
});
