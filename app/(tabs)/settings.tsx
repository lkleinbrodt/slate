import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect } from "react";

import { SafeAreaThemedView } from "@/components/safe-area-themed-view";
import { TabHeader } from "@/components/shared/TabHeader";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useSettingsStore } from "@/lib/stores/settings";

export default function SettingsScreen() {
  const {
    dayStart,
    autoCarryover,
    habitReminderTime,
    eveningNudgeEnabled,
    taskReminderTime,
    todayReminderEnabled,
    hapticsEnabled,
    soundEnabled,
    loading,
    loadSettings,
    updateDayStart,
    updateAutoCarryover,
    updateHabitReminderTime,
    updateEveningNudge,
    updateTaskReminderTime,
    updateTodayReminder,
    updateHaptics,
    updateSound,
  } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleDayStartChange = (time: string) => {
    updateDayStart(time);
  };

  const handleReminderTimeChange = (type: "habit" | "task", time: string) => {
    if (type === "habit") {
      updateHabitReminderTime(time);
    } else {
      updateTaskReminderTime(time);
    }
  };

  if (loading) {
    return (
      <SafeAreaThemedView style={styles.container}>
        <ThemedView style={styles.centerContainer}>
          <Text>Loading settings...</Text>
        </ThemedView>
      </SafeAreaThemedView>
    );
  }

  return (
    <SafeAreaThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <TabHeader title="Settings" />

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Day & Time
          </ThemedText>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingLabel}>
                Day Start Time
              </ThemedText>
              <ThemedText style={styles.settingDescription}>
                When your day begins (affects rollover and streaks)
              </ThemedText>
            </View>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => {
                // In a real app, you'd show a time picker
                Alert.alert(
                  "Day Start Time",
                  "Time picker would open here. For now, using 04:00 as default.",
                  [{ text: "OK" }]
                );
              }}
            >
              <ThemedText style={styles.timeButtonText}>{dayStart}</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingLabel}>
                Auto Carryover
              </ThemedText>
              <ThemedText style={styles.settingDescription}>
                Move unfinished tasks to tomorrow
              </ThemedText>
            </View>
            <Switch
              value={autoCarryover}
              onValueChange={updateAutoCarryover}
              trackColor={{ false: "#E5E7EB", true: "#10B981" }}
              thumbColor={autoCarryover ? "#FFFFFF" : "#FFFFFF"}
            />
          </View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Notifications
          </ThemedText>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingLabel}>
                Habit Reminders
              </ThemedText>
              <ThemedText style={styles.settingDescription}>
                Daily reminder for habits
              </ThemedText>
            </View>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => {
                Alert.alert(
                  "Habit Reminder Time",
                  "Time picker would open here. For now, using 08:00 as default.",
                  [{ text: "OK" }]
                );
              }}
            >
              <ThemedText style={styles.timeButtonText}>
                {habitReminderTime}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingLabel}>Evening Nudge</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Remind about incomplete habits
              </ThemedText>
            </View>
            <Switch
              value={eveningNudgeEnabled}
              onValueChange={updateEveningNudge}
              trackColor={{ false: "#E5E7EB", true: "#10B981" }}
              thumbColor={eveningNudgeEnabled ? "#FFFFFF" : "#FFFFFF"}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingLabel}>
                Task Reminders
              </ThemedText>
              <ThemedText style={styles.settingDescription}>
                Remind about due tasks
              </ThemedText>
            </View>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => {
                Alert.alert(
                  "Task Reminder Time",
                  "Time picker would open here. For now, using 09:00 as default.",
                  [{ text: "OK" }]
                );
              }}
            >
              <ThemedText style={styles.timeButtonText}>
                {taskReminderTime}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingLabel}>
                Today Reminder
              </ThemedText>
              <ThemedText style={styles.settingDescription}>
                Daily reminder to plan your day
              </ThemedText>
            </View>
            <Switch
              value={todayReminderEnabled}
              onValueChange={updateTodayReminder}
              trackColor={{ false: "#E5E7EB", true: "#10B981" }}
              thumbColor={todayReminderEnabled ? "#FFFFFF" : "#FFFFFF"}
            />
          </View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Experience
          </ThemedText>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingLabel}>Haptics</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Vibration feedback on interactions
              </ThemedText>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={updateHaptics}
              trackColor={{ false: "#E5E7EB", true: "#10B981" }}
              thumbColor={hapticsEnabled ? "#FFFFFF" : "#FFFFFF"}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingLabel}>Sounds</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Audio feedback on interactions
              </ThemedText>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={updateSound}
              trackColor={{ false: "#E5E7EB", true: "#10B981" }}
              thumbColor={soundEnabled ? "#FFFFFF" : "#FFFFFF"}
            />
          </View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Data
          </ThemedText>

          <TouchableOpacity style={styles.actionButton}>
            <ThemedText style={styles.actionButtonText}>Export Data</ThemedText>
            <ThemedText style={styles.actionButtonDescription}>
              Save your data to Files app
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <ThemedText style={styles.actionButtonText}>Import Data</ThemedText>
            <ThemedText style={styles.actionButtonDescription}>
              Restore from backup file
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </SafeAreaThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    marginBottom: 20,
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 18,
  },
  timeButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  actionButtonDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
});
