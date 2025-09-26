import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { AddButtonProps } from "./types";
import React from "react";

export const AddButton: React.FC<AddButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.unifiedAddButton} onPress={onPress}>
      <Text style={styles.unifiedAddButtonText}>+</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  unifiedAddButton: {
    backgroundColor: "#10B981",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unifiedAddButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "300",
  },
});
