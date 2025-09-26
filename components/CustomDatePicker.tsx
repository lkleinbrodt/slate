import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { formatDate, getToday } from "@/lib/utils/dateFormat";

import { Calendar } from "react-native-calendars";
import { ThemedText } from "./themed-text";

interface CustomDatePickerProps {
  visible: boolean;
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  onClose: () => void;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  visible,
  selectedDate,
  onDateSelect,
  onClose,
}) => {
  const [tempDate, setTempDate] = useState<Date | null>(selectedDate);

  const handleDatePress = (day: any) => {
    // Create date in local timezone to avoid UTC conversion issues
    const [year, month, dayNum] = day.dateString.split("-").map(Number);
    const newDate = new Date(year, month - 1, dayNum); // month is 0-indexed

    const today = getToday();

    // Only allow dates from today onwards
    if (newDate >= today) {
      setTempDate(newDate);
    }
  };

  const handleConfirm = () => {
    onDateSelect(tempDate);
    onClose();
  };

  const handleClear = () => {
    setTempDate(null);
    onDateSelect(null);
    onClose();
  };

  const getMarkedDates = () => {
    const today = getToday();
    const todayString = today.toISOString().split("T")[0];

    const markedDates: any = {
      [todayString]: {
        marked: true,
        dotColor: "#10B981",
        textColor: "#10B981",
      },
    };

    if (tempDate) {
      // Create date string in local timezone
      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, "0");
      const day = String(tempDate.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      markedDates[dateString] = {
        selected: true,
        selectedColor: "#10B981",
        selectedTextColor: "white",
      };
    }

    // Mark all past dates as disabled
    const currentDate = new Date(today);
    for (let i = 0; i < 365; i++) {
      // Go back up to a year
      const pastDate = new Date(currentDate);
      pastDate.setDate(pastDate.getDate() - i);
      const pastDateString = pastDate.toISOString().split("T")[0];

      if (pastDateString !== todayString && !markedDates[pastDateString]) {
        markedDates[pastDateString] = {
          disabled: true,
          disableTouchEvent: true,
        };
      }
    }

    return markedDates;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.title}>
              Select Due Date
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={handleDatePress}
              markedDates={getMarkedDates()}
              disableAllTouchEventsForDisabledDays={true}
              theme={{
                backgroundColor: "white",
                calendarBackground: "white",
                textSectionTitleColor: "#6B7280",
                selectedDayBackgroundColor: "#10B981",
                selectedDayTextColor: "white",
                todayTextColor: "#10B981",
                dayTextColor: "#374151",
                textDisabledColor: "#D1D5DB",
                arrowColor: "#10B981",
                monthTextColor: "#374151",
                indicatorColor: "#10B981",
                textDayFontWeight: "500",
                textMonthFontWeight: "600",
                textDayHeaderFontWeight: "600",
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              style={styles.calendar}
            />
          </View>

          <View style={styles.selectedDateContainer}>
            <ThemedText style={styles.selectedDateLabel}>
              Selected: {formatDate(tempDate)}
            </ThemedText>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: "white",
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
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  calendarContainer: {
    marginBottom: 20,
  },
  calendar: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedDateContainer: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  selectedDateLabel: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  clearButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  clearButtonText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: "#10B981",
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
