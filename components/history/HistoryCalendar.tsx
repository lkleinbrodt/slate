import { Animated, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";

import { Calendar } from "react-native-calendars";
import { useHistoryStore } from "@/lib/stores/historyStore";

export const HistoryCalendar = () => {
  const { calendarData, earliestDate, currentDate, actions } =
    useHistoryStore();

  const [currentDisplayedMonth, setCurrentDisplayedMonth] = useState(
    new Date().toISOString().substring(0, 7)
  );

  const [notificationOpacity] = useState(new Animated.Value(0));
  const [notificationText, setNotificationText] = useState("");

  const getMarkedDates = () => {
    const marked = {};
    for (const date in calendarData) {
      const day = calendarData[date];
      const ratio =
        day.totalHabits > 0 ? day.completedHabits / day.totalHabits : 0;
      let color = "#E5E7EB"; // Gray for no habits
      if (day.totalHabits > 0) {
        if (ratio === 1) color = "#10B981"; // Green
        else if (ratio > 0) color = "#F59E0B"; // Yellow
        else color = "#EF4444"; // Red
      }
      (marked as any)[date] = {
        customStyles: {
          container: { backgroundColor: color },
          text: { color: "white", children: day.completedTasks },
        },
      };
    }
    return marked;
  };

  const getMinDate = () => {
    return earliestDate || currentDate;
  };

  const getMaxDate = () => {
    return currentDate;
  };

  const isDateDisabled = (date: string) => {
    // Disable future dates
    if (date > currentDate) return true;

    // Disable dates before earliest history
    if (earliestDate && date < earliestDate) return true;

    return false;
  };

  const canNavigateLeft = () => {
    if (!earliestDate) return false;
    const earliestMonth = earliestDate.substring(0, 7); // YYYY-MM
    return currentDisplayedMonth > earliestMonth;
  };

  const canNavigateRight = () => {
    const currentMonthStr = currentDate.substring(0, 7); // YYYY-MM
    return currentDisplayedMonth < currentMonthStr;
  };

  const showNotification = (message: string) => {
    setNotificationText(message);
    Animated.sequence([
      Animated.timing(notificationOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(notificationOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      <Calendar
        markingType={"custom"}
        markedDates={getMarkedDates()}
        minDate={getMinDate()}
        maxDate={getMaxDate()}
        onMonthChange={(month) => {
          // Only allow loading months that have history data
          const monthDate = month.dateString;
          if (isDateDisabled(monthDate)) return;
          setCurrentDisplayedMonth(monthDate.substring(0, 7));
          actions.loadCalendarDataForMonth(monthDate);
        }}
        onDayPress={(day) => {
          // Only allow selecting dates that have history data
          if (isDateDisabled(day.dateString)) return;
          actions.selectDay(day.dateString);
        }}
        onPressArrowLeft={(subtractMonth) => {
          if (canNavigateLeft()) {
            subtractMonth();
          } else {
            showNotification("No earlier history");
          }
        }}
        onPressArrowRight={(addMonth) => {
          if (canNavigateRight()) {
            addMonth();
          } else {
            showNotification("No future data");
          }
        }}
        disableAllTouchEventsForDisabledDays={true}
        disableAllTouchEventsForInactiveDays={true}
        theme={{
          backgroundColor: "transparent",
          calendarBackground: "transparent",
          textSectionTitleColor: "#007AFF",
          selectedDayBackgroundColor: "#007AFF",
          selectedDayTextColor: "#ffffff",
          todayTextColor: "#007AFF",
          dayTextColor: "#000000",
          textDisabledColor: "#d9e1e8",
          dotColor: "#00adf5",
          selectedDotColor: "#ffffff",
          arrowColor: "#007AFF",
          monthTextColor: "#000000",
          indicatorColor: "#007AFF",
          textDayFontWeight: "300",
          textMonthFontWeight: "bold",
          textDayHeaderFontWeight: "300",
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 13,
        }}
      />

      {/* Notification Toast */}
      <Animated.View
        style={[styles.notification, { opacity: notificationOpacity }]}
      >
        <Text style={styles.notificationText}>{notificationText}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    position: "relative",
  },
  notification: {
    position: "absolute",
    top: 10,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    zIndex: 1000,
  },
  notificationText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});
