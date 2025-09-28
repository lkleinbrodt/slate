import React, { useEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaThemedView } from "@/components/safe-area-themed-view";
import { SettingsCard } from "@/components/SettingsCard";
import { TabHeader } from "@/components/shared/TabHeader";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TimePickerButton } from "@/components/TimePickerButton";
import { useThemeColor } from "@/hooks/use-theme-color";
import { UI } from "@/lib/constants/app";
import { useSettingsStore } from "@/lib/stores/settings";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const primaryColor = useThemeColor({}, "primary");
  const successColor = useThemeColor({}, "success");
  const textTertiaryColor = useThemeColor({}, "textTertiary");

  const { dayStart, loading, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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

        {/* Day & Time Settings */}
        <SettingsCard icon="time-outline" title="Day & Time">
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText type="bodySemiBold" style={styles.settingLabel}>
                Day Start Time
              </ThemedText>
              <ThemedText type="caption" style={styles.settingDescription}>
                When your day begins (affects rollover and streaks)
              </ThemedText>
            </View>
            <TimePickerButton
              time={dayStart}
              onPress={() => {
                Alert.alert(
                  "Day Start Time",
                  "Time picker would open here. For now, using 04:00 as default.",
                  [{ text: "OK" }]
                );
              }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText type="bodySemiBold" style={styles.settingLabel}>
                Auto Carryover
              </ThemedText>
              <ThemedText type="caption" style={styles.settingDescription}>
                Move unfinished tasks to tomorrow
              </ThemedText>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: "#E5E7EB", true: successColor }}
              thumbColor="#FFFFFF"
            />
          </View>
        </SettingsCard>

        {/* Notifications Settings */}
        <SettingsCard icon="notifications-outline" title="Notifications">
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText type="bodySemiBold" style={styles.settingLabel}>
                Habit Reminders
              </ThemedText>
              <ThemedText type="caption" style={styles.settingDescription}>
                Daily reminder for habits
              </ThemedText>
            </View>
            <TimePickerButton
              time="08:00"
              onPress={() => {
                Alert.alert(
                  "Habit Reminder Time",
                  "Time picker would open here. For now, using 08:00 as default.",
                  [{ text: "OK" }]
                );
              }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText type="bodySemiBold" style={styles.settingLabel}>
                Evening Nudge
              </ThemedText>
              <ThemedText type="caption" style={styles.settingDescription}>
                Remind about incomplete habits
              </ThemedText>
            </View>
            <Switch
              value={false}
              onValueChange={() => {}}
              trackColor={{ false: "#E5E7EB", true: successColor }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText type="bodySemiBold" style={styles.settingLabel}>
                Task Reminders
              </ThemedText>
              <ThemedText type="caption" style={styles.settingDescription}>
                Remind about due tasks
              </ThemedText>
            </View>
            <TimePickerButton
              time="09:00"
              onPress={() => {
                Alert.alert(
                  "Task Reminder Time",
                  "Time picker would open here. For now, using 09:00 as default.",
                  [{ text: "OK" }]
                );
              }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText type="bodySemiBold" style={styles.settingLabel}>
                Today Reminder
              </ThemedText>
              <ThemedText type="caption" style={styles.settingDescription}>
                Daily reminder to plan your day
              </ThemedText>
            </View>
            <Switch
              value={false}
              onValueChange={() => {}}
              trackColor={{ false: "#E5E7EB", true: successColor }}
              thumbColor="#FFFFFF"
            />
          </View>
        </SettingsCard>

        {/* Experience Settings */}
        <SettingsCard icon="settings-outline" title="Experience">
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText type="bodySemiBold" style={styles.settingLabel}>
                Haptics
              </ThemedText>
              <ThemedText type="caption" style={styles.settingDescription}>
                Vibration feedback on interactions
              </ThemedText>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: "#E5E7EB", true: successColor }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText type="bodySemiBold" style={styles.settingLabel}>
                Sounds
              </ThemedText>
              <ThemedText type="caption" style={styles.settingDescription}>
                Audio feedback on interactions
              </ThemedText>
            </View>
            <Switch
              value={false}
              onValueChange={() => {}}
              trackColor={{ false: "#E5E7EB", true: successColor }}
              thumbColor="#FFFFFF"
            />
          </View>
        </SettingsCard>

        {/* Data Settings */}
        <SettingsCard icon="cloud-outline" title="Data & Backup">
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionButtonContent}>
              <Ionicons
                name="download-outline"
                size={20}
                color={primaryColor}
              />
              <View style={styles.actionButtonText}>
                <ThemedText
                  type="bodySemiBold"
                  style={styles.actionButtonTitle}
                >
                  Export Data
                </ThemedText>
                <ThemedText
                  type="caption"
                  style={styles.actionButtonDescription}
                >
                  Save your data to Files app
                </ThemedText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={textTertiaryColor}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionButtonContent}>
              <Ionicons
                name="cloud-upload-outline"
                size={20}
                color={primaryColor}
              />
              <View style={styles.actionButtonText}>
                <ThemedText
                  type="bodySemiBold"
                  style={styles.actionButtonTitle}
                >
                  Import Data
                </ThemedText>
                <ThemedText
                  type="caption"
                  style={styles.actionButtonDescription}
                >
                  Restore from backup file
                </ThemedText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={textTertiaryColor}
              />
            </View>
          </TouchableOpacity>
        </SettingsCard>
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
    padding: UI.SPACING.MD,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: UI.SPACING.LG,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: UI.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  settingContent: {
    flex: 1,
    marginRight: UI.SPACING.MD,
  },
  settingLabel: {
    marginBottom: UI.SPACING.XS,
  },
  settingDescription: {
    opacity: 0.7,
    lineHeight: 18,
  },
  actionButton: {
    paddingVertical: UI.SPACING.MD,
    paddingHorizontal: UI.SPACING.XS,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: UI.SPACING.SM,
  },
  actionButtonText: {
    flex: 1,
  },
  actionButtonTitle: {
    marginBottom: UI.SPACING.XS,
  },
  actionButtonDescription: {
    opacity: 0.7,
  },
});
