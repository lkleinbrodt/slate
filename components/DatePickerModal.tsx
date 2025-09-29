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
import { useThemeColor } from "@/hooks/use-theme-color";

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

  // Theme colors
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textTertiaryColor = useThemeColor({}, "textTertiary");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const borderColor = useThemeColor({}, "border");

  const handleDateSelect = (day: any) => {
    onDateSelect?.(day.dateString);
    SheetManager.hide(sheetId);
  };

  // Create styles with theme colors
  const styles = createStyles({
    backgroundColor,
    textColor,
    textTertiaryColor,
    errorColor,
    borderColor,
  });

  const handleCancel = () => {
    SheetManager.hide(sheetId);
  };

  const handleClear = () => {
    onDateSelect?.(null);
    SheetManager.hide(sheetId);
  };

  return (
    <ActionSheet
      id={sheetId}
      gestureEnabled={true}
      safeAreaInsets={insets}
      containerStyle={{ backgroundColor: backgroundColor }}
      indicatorStyle={{ backgroundColor: backgroundColor }}
    >
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
              selectedColor: successColor,
            },
          }}
          theme={{
            backgroundColor: backgroundColor,
            calendarBackground: backgroundColor,
            selectedDayBackgroundColor: successColor,
            selectedDayTextColor: "#ffffff",
            todayTextColor: successColor,
            dayTextColor: textColor,
            textDisabledColor: textTertiaryColor,
            arrowColor: successColor,
            monthTextColor: textColor,
            indicatorColor: successColor,
          }}
        />
      </View>
    </ActionSheet>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.backgroundColor,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textColor,
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
      color: colors.errorColor,
      fontWeight: "500",
    },
    cancelButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    cancelText: {
      fontSize: 16,
      color: colors.textTertiaryColor,
    },
  });
