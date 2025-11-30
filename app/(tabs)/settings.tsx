import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { SafeAreaThemedView } from "@/components/safe-area-themed-view";
import { SettingsCard } from "@/components/SettingsCard";
import { TabHeader } from "@/components/shared/TabHeader";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TimePickerButton } from "@/components/TimePickerButton";
import { TimePickerModal } from "@/components/TimePickerModal";
import { useThemeColor } from "@/hooks/use-theme-color";
import { UI } from "@/lib/constants/app";
import { getNotificationPermissionStatus, requestNotificationPermissions, rescheduleAllNotifications } from "@/lib/services/notifications";
import { useSettingsStore } from "@/lib/stores/settings";

export default function SettingsScreen() {
  const successColor = useThemeColor({}, "success");
  const textTertiaryColor = useThemeColor({}, "textTertiary");

  const {
    loading,
    loadSettings,
    planYourDayEnabled,
    planYourDayTime,
    habitRemindersEnabled,
    habitReminderInterval,
    nightReviewEnabled,
    nightReviewTime,
    notificationPermissionStatus,
    updatePlanYourDaySettings,
    updateHabitReminderSettings,
    updateNightReviewSettings,
    setNotificationPermissionStatus,
  } = useSettingsStore();

  const [planDayTimePickerVisible, setPlanDayTimePickerVisible] = useState(false);
  const [nightReviewTimePickerVisible, setNightReviewTimePickerVisible] = useState(false);
  const [intervalPickerVisible, setIntervalPickerVisible] = useState(false);

  useEffect(() => {
    loadSettings();
    // Check permission status on mount
    getNotificationPermissionStatus().then((status) => {
      setNotificationPermissionStatus(status);
    });
  }, [loadSettings, setNotificationPermissionStatus]);

  if (loading) {
    return (
      <SafeAreaThemedView style={styles.container}>
        <ThemedView style={styles.centerContainer}>
          <Text>Loading settings...</Text>
        </ThemedView>
      </SafeAreaThemedView>
    );
  }

  const handlePlanDayToggle = async (enabled: boolean) => {
    await updatePlanYourDaySettings(enabled, planYourDayTime);
    await rescheduleAllNotifications();
  };

  const handlePlanDayTimeChange = async (time: string) => {
    await updatePlanYourDaySettings(planYourDayEnabled, time);
    await rescheduleAllNotifications();
  };

  const handleHabitReminderToggle = async (enabled: boolean) => {
    await updateHabitReminderSettings(enabled, habitReminderInterval);
    await rescheduleAllNotifications();
  };

  const handleHabitReminderIntervalChange = async (interval: number) => {
    await updateHabitReminderSettings(habitRemindersEnabled, interval);
    await rescheduleAllNotifications();
  };

  const handleNightReviewToggle = async (enabled: boolean) => {
    await updateNightReviewSettings(enabled, nightReviewTime);
    await rescheduleAllNotifications();
  };

  const handleNightReviewTimeChange = async (time: string) => {
    await updateNightReviewSettings(nightReviewEnabled, time);
    await rescheduleAllNotifications();
  };

  const handleRequestPermissions = async () => {
    const granted = await requestNotificationPermissions();
    if (granted) {
      await rescheduleAllNotifications();
    } else {
      Alert.alert(
        "Permission Denied",
        "To receive notifications, please enable them in Settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings(),
          },
        ]
      );
    }
  };

  const getPermissionStatusText = () => {
    switch (notificationPermissionStatus) {
      case "granted":
        return "Enabled";
      case "denied":
        return "Denied - Open Settings to enable";
      default:
        return "Not requested";
    }
  };


  return (
    <SafeAreaThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <TabHeader title="Settings" />

        {/* Notifications Settings */}
        <SettingsCard icon="notifications-outline" title="Notifications">
          {/* Permission Status */}
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText type="bodySemiBold" style={styles.settingLabel}>
                Notification Permission
              </ThemedText>
              <ThemedText type="caption" style={styles.settingDescription}>
                {getPermissionStatusText()}
              </ThemedText>
            </View>
            {notificationPermissionStatus !== "granted" && (
              <TouchableOpacity
                style={[styles.permissionButton, { backgroundColor: successColor }]}
                onPress={handleRequestPermissions}
              >
                <Text style={styles.permissionButtonText}>
                  {notificationPermissionStatus === "denied" ? "Open Settings" : "Enable"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Plan Your Day */}
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText type="bodySemiBold" style={styles.settingLabel}>
                Plan Your Day
              </ThemedText>
              <ThemedText type="caption" style={styles.settingDescription}>
                Morning reminder to move tasks from Slate to Today
              </ThemedText>
            </View>
            <Switch
              value={planYourDayEnabled}
              onValueChange={handlePlanDayToggle}
              trackColor={{ false: "#E5E7EB", true: successColor }}
              thumbColor="#FFFFFF"
              disabled={notificationPermissionStatus !== "granted"}
            />
          </View>
          {planYourDayEnabled && (
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <ThemedText type="caption" style={styles.settingDescription}>
                  Reminder time
                </ThemedText>
              </View>
              <TimePickerButton
                time={planYourDayTime}
                onPress={() => setPlanDayTimePickerVisible(true)}
                disabled={notificationPermissionStatus !== "granted"}
              />
            </View>
          )}

          {/* Habit Reminders */}
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText type="bodySemiBold" style={styles.settingLabel}>
                Habit Reminders
              </ThemedText>
              <ThemedText type="caption" style={styles.settingDescription}>
                Periodic reminders throughout the day (only if habits incomplete)
              </ThemedText>
            </View>
            <Switch
              value={habitRemindersEnabled}
              onValueChange={handleHabitReminderToggle}
              trackColor={{ false: "#E5E7EB", true: successColor }}
              thumbColor="#FFFFFF"
              disabled={notificationPermissionStatus !== "granted"}
            />
          </View>
          {habitRemindersEnabled && (
            <>
              <View style={styles.settingRow}>
                <View style={styles.settingContent}>
                  <ThemedText type="caption" style={styles.settingDescription}>
                    Reminder interval (hours)
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.intervalButton, { borderColor: textTertiaryColor }]}
                  onPress={() => setIntervalPickerVisible(true)}
                  disabled={notificationPermissionStatus !== "granted"}
                >
                  <ThemedText type="body" style={styles.intervalButtonText}>
                    Every {habitReminderInterval} hour{habitReminderInterval !== 1 ? "s" : ""}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Night Review */}
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText type="bodySemiBold" style={styles.settingLabel}>
                Night Review
              </ThemedText>
              <ThemedText type="caption" style={styles.settingDescription}>
                Evening reminder about incomplete tasks and Slate cleanup
              </ThemedText>
            </View>
            <Switch
              value={nightReviewEnabled}
              onValueChange={handleNightReviewToggle}
              trackColor={{ false: "#E5E7EB", true: successColor }}
              thumbColor="#FFFFFF"
              disabled={notificationPermissionStatus !== "granted"}
            />
          </View>
          {nightReviewEnabled && (
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <ThemedText type="caption" style={styles.settingDescription}>
                  Reminder time
                </ThemedText>
              </View>
              <TimePickerButton
                time={nightReviewTime}
                onPress={() => setNightReviewTimePickerVisible(true)}
                disabled={notificationPermissionStatus !== "granted"}
              />
            </View>
          )}
        </SettingsCard>
      </ScrollView>

      {/* Time Picker Modals */}
      <TimePickerModal
        visible={planDayTimePickerVisible}
        selectedTime={planYourDayTime}
        onTimeSelect={handlePlanDayTimeChange}
        onClose={() => setPlanDayTimePickerVisible(false)}
      />

      <TimePickerModal
        visible={nightReviewTimePickerVisible}
        selectedTime={nightReviewTime}
        onTimeSelect={handleNightReviewTimeChange}
        onClose={() => setNightReviewTimePickerVisible(false)}
      />

      {/* Interval Picker Modal */}
      {intervalPickerVisible && (
        <View style={styles.intervalModalOverlay}>
          <ThemedView style={styles.intervalModal}>
            <ThemedText type="h3" style={styles.intervalModalTitle}>
              Select Interval
            </ThemedText>
            {[2, 3, 4, 6].map((interval) => (
              <TouchableOpacity
                key={interval}
                style={[
                  styles.intervalOption,
                  habitReminderInterval === interval && { backgroundColor: successColor + "20" },
                ]}
                onPress={() => {
                  handleHabitReminderIntervalChange(interval);
                  setIntervalPickerVisible(false);
                }}
              >
                <ThemedText
                  type="body"
                  style={[
                    styles.intervalOptionText,
                    habitReminderInterval === interval && { color: successColor, fontWeight: "600" },
                  ]}
                >
                  Every {interval} hour{interval !== 1 ? "s" : ""}
                </ThemedText>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.intervalCancelButton}
              onPress={() => setIntervalPickerVisible(false)}
            >
              <ThemedText type="body" style={styles.intervalCancelText}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      )}
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
  permissionButton: {
    paddingHorizontal: UI.SPACING.MD,
    paddingVertical: UI.SPACING.SM,
    borderRadius: UI.BORDER_RADIUS.MD,
    minHeight: UI.MIN_TOUCH_TARGET_SIZE,
    justifyContent: "center",
  },
  permissionButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  intervalButton: {
    paddingHorizontal: UI.SPACING.MD,
    paddingVertical: UI.SPACING.SM,
    borderRadius: UI.BORDER_RADIUS.MD,
    borderWidth: 1,
    minHeight: UI.MIN_TOUCH_TARGET_SIZE,
    justifyContent: "center",
  },
  intervalButtonText: {
    fontWeight: "500",
  },
  intervalModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  intervalModal: {
    borderRadius: 20,
    padding: 20,
    maxWidth: 400,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  intervalModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },
  intervalOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
  },
  intervalOptionText: {
    fontSize: 16,
  },
  intervalCancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  intervalCancelText: {
    fontSize: 16,
    opacity: 0.7,
  },
});
