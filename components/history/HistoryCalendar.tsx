import { Animated, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import {
  getCurrentMonth,
  getSixMonthsAgo,
  isDateAfter,
} from "@/lib/logic/dates";

import { Calendar } from "react-native-calendars";
import { useHistoryStore } from "@/lib/stores/historyStore";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useTimeStore } from "@/lib/stores/timeStore";

interface HistoryCalendarProps {
  onDayPress: (date: string) => void;
}

export const HistoryCalendar = ({ onDayPress }: HistoryCalendarProps) => {
  const { calendarData, loadCalendarData } = useHistoryStore();
  const { getCurrentDate } = useTimeStore();

  // Theme colors
  const backgroundColor = useThemeColor({}, "background");
  const calendarBackground = useThemeColor({}, "backgroundSecondary");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const textTertiaryColor = useThemeColor({}, "textTertiary");
  const primaryColor = useThemeColor({}, "primary");

  const [currentDisplayedMonth, setCurrentDisplayedMonth] = useState(
    getCurrentMonth()
  );

  const [notificationOpacity] = useState(new Animated.Value(0));
  const [notificationText, setNotificationText] = useState("");

  const currentDate = getCurrentDate();
  const sixMonthsAgo = getSixMonthsAgo();

  const getMarkedDates = () => {
    const marked = {};
    for (const date in calendarData) {
      const day = calendarData[date];
      let color = "#E5E7EB"; // Gray for no data

      if (day.habitsCompleted > 0) {
        if (day.isPerfectDay) color = "#10B981"; // Green for perfect day
        else color = "#F59E0B"; // Yellow for partial completion
      }

      (marked as any)[date] = {
        customStyles: {
          container: { backgroundColor: color },
          text: { color: "white" },
        },
      };
    }
    return marked;
  };

  const getMinDate = () => {
    // Allow going back 6 months
    return sixMonthsAgo;
  };

  const getMaxDate = () => {
    return currentDate;
  };

  const isDateDisabled = (date: string) => {
    // Disable future dates using proper date comparison
    return isDateAfter(date, currentDate);
  };

  const canNavigateLeft = () => {
    const earliestMonth = sixMonthsAgo.substring(0, 7);
    return currentDisplayedMonth > earliestMonth;
  };

  const canNavigateRight = () => {
    const currentMonthStr = currentDate.substring(0, 7);
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
        disableArrowLeft={!canNavigateLeft()}
        disableArrowRight={!canNavigateRight()}
        minDate={getMinDate()}
        maxDate={getMaxDate()}
        onMonthChange={(month) => {
          const monthDate = month.dateString;
          const monthStr = monthDate.substring(0, 7);

          // Check if the month is within our allowed range
          const earliestMonth = sixMonthsAgo.substring(0, 7);
          const currentMonthStr = currentDate.substring(0, 7);

          if (monthStr < earliestMonth || monthStr > currentMonthStr) {
            return;
          }

          setCurrentDisplayedMonth(monthStr);
          loadCalendarData(monthStr);
        }}
        onDayPress={(day) => {
          if (isDateDisabled(day.dateString)) return;
          onDayPress(day.dateString);
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
          backgroundColor: backgroundColor,
          calendarBackground: calendarBackground,
          textSectionTitleColor: textSecondaryColor,
          selectedDayBackgroundColor: primaryColor,
          selectedDayTextColor: "#ffffff",
          todayTextColor: primaryColor,
          dayTextColor: textColor,
          textDisabledColor: textTertiaryColor,
          dotColor: primaryColor,
          selectedDotColor: "#ffffff",
          arrowColor: primaryColor,
          monthTextColor: textColor,
          indicatorColor: primaryColor,
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
        style={[
          styles.notification,
          {
            opacity: notificationOpacity,
            backgroundColor:
              textColor === "#0F172A"
                ? "rgba(0, 0, 0, 0.8)"
                : "rgba(255, 255, 255, 0.9)",
          },
        ]}
      >
        <Text style={[styles.notificationText, { color: backgroundColor }]}>
          {notificationText}
        </Text>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    zIndex: 1000,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
