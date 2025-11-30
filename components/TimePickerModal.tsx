import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { UI } from "@/lib/constants/app";

interface TimePickerModalProps {
  visible: boolean;
  selectedTime: string; // HH:mm format
  onTimeSelect: (time: string) => void;
  onClose: () => void;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  selectedTime,
  onTimeSelect,
  onClose,
}) => {
  const [tempHour, setTempHour] = useState(() => {
    const [hour] = selectedTime.split(":").map(Number);
    return hour;
  });
  const [tempMinute, setTempMinute] = useState(() => {
    const [, minute] = selectedTime.split(":").map(Number);
    return minute;
  });

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const successColor = useThemeColor({}, "success");
  const borderColor = useThemeColor({}, "border");

  const handleConfirm = () => {
    const timeString = `${String(tempHour).padStart(2, "0")}:${String(tempMinute).padStart(2, "0")}`;
    onTimeSelect(timeString);
    onClose();
  };

  const renderNumberPicker = (
    values: number[],
    selected: number,
    onSelect: (value: number) => void
  ) => {
    return (
      <ScrollView
        style={styles.pickerColumn}
        contentContainerStyle={styles.pickerColumnContent}
        showsVerticalScrollIndicator={false}
      >
        {values.map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.pickerItem,
              selected === value && { backgroundColor: successColor + "20" },
            ]}
            onPress={() => onSelect(value)}
          >
            <Text
              style={[
                styles.pickerText,
                { color: selected === value ? successColor : textColor },
                selected === value && styles.pickerTextSelected,
              ]}
            >
              {String(value).padStart(2, "0")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modal}>
          <View style={styles.header}>
            <ThemedText type="h3" style={styles.title}>
              Select Time
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: textSecondaryColor }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            <View style={styles.pickerWrapper}>
              {renderNumberPicker(hours, tempHour, setTempHour)}
              <ThemedText type="title" style={styles.separator}>
                :
              </ThemedText>
              {renderNumberPicker(minutes, tempMinute, setTempMinute)}
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: borderColor }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: textColor }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: successColor }]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    borderRadius: 20,
    padding: 20,
    maxWidth: 400,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  pickerContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  pickerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pickerColumn: {
    maxHeight: 200,
    width: 80,
  },
  pickerColumnContent: {
    paddingVertical: 4,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
    alignItems: "center",
  },
  pickerText: {
    fontSize: 18,
    fontWeight: "500",
  },
  pickerTextSelected: {
    fontWeight: "700",
  },
  separator: {
    fontSize: 24,
    marginHorizontal: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
  },
  cancelButtonText: {
    fontWeight: "600",
    fontSize: 16,
  },
  confirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});

