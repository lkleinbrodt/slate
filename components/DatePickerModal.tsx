//Calendar ActionSheet
//Opens up an ActionSheet with a calendar that lets you select a date
// and reports that date to the parent component

import ActionSheet, {
  SheetManager,
  SheetProps,
} from "react-native-actions-sheet";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Calendar } from "react-native-calendars";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DatePickerActionSheetProps = SheetProps<"date-picker-sheet">;

export default function DatePickerActionSheet({
  sheetId,
  payload,
}: DatePickerActionSheetProps) {
  const insets = useSafeAreaInsets();
  const {
    onDateSelect,
    selectedDate = null,
    title = "Select Date",
  } = payload || {};

  const handleDateSelect = (day: any) => {
    onDateSelect?.(day.dateString);
    SheetManager.hide(sheetId);
  };

  const handleCancel = () => {
    SheetManager.hide(sheetId);
  };

  const handleClear = () => {
    onDateSelect?.(null);
    SheetManager.hide(sheetId);
  };

  return (
    <ActionSheet id={sheetId} gestureEnabled={true} safeAreaInsets={insets}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Text style={styles.clearText}>Clear Date</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Calendar
          onDayPress={handleDateSelect}
          markedDates={{
            [selectedDate || ""]: {
              selected: true,
              selectedColor: "#10B981",
            },
          }}
          theme={{
            selectedDayBackgroundColor: "#10B981",
            todayTextColor: "#10B981",
          }}
        />
      </View>
    </ActionSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  clearText: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "500",
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 16,
    color: "#6B7280",
  },
});
