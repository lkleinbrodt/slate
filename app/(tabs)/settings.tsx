import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import {
  ActionSheetIOS,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { Icon, type IconName } from "@/components/ui/Icon";
import React, { useEffect, useState } from "react";
import { getNotificationPermissionStatus, requestNotificationPermissions, rescheduleAllNotifications } from "@/lib/services/notifications";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DeveloperTools } from "@/components/settings/DeveloperTools";
import { Radius } from "@/constants/theme";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ThemedText } from "@/components/themed-text";
import { TimePickerButton, formatTime } from "@/components/TimePickerButton";
import { TimePickerModal } from "@/components/TimePickerModal";
import { VoiceSettings } from "@/components/settings/VoiceSettings";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsStore } from "@/lib/stores/settings";
import { useTabBarSpace } from "@/components/TabBar";
import { useTheme } from "@/hooks/use-theme";

type TimeField = "planDay" | "nightReview" | "windowStart" | "windowEnd";

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();

  const {
    loading,
    loadSettings,
    dayStart,
    planYourDayEnabled,
    planYourDayTime,
    habitRemindersEnabled,
    habitReminderInterval,
    habitReminderStart,
    habitReminderEnd,
    nightReviewEnabled,
    nightReviewTime,
    notificationPermissionStatus,
    updatePlanYourDaySettings,
    updateHabitReminderSettings,
    updateHabitReminderWindow,
    updateNightReviewSettings,
    setNotificationPermissionStatus,
  } = useSettingsStore();

  // Mounted per open so the picker starts from the current value
  const [editingTime, setEditingTime] = useState<TimeField | null>(null);

  useEffect(() => {
    loadSettings();
    // Check permission status on mount
    getNotificationPermissionStatus().then((status) => {
      setNotificationPermissionStatus(status);
    });
  }, [loadSettings, setNotificationPermissionStatus]);

  if (loading) {
    return <Screen />;
  }

  const granted = notificationPermissionStatus === "granted";

  const handlePlanDayToggle = async (enabled: boolean) => {
    await updatePlanYourDaySettings(enabled, planYourDayTime);
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

  const handleTimeChange = async (time: string) => {
    if (editingTime === "planDay") {
      await updatePlanYourDaySettings(planYourDayEnabled, time);
    } else if (editingTime === "nightReview") {
      await updateNightReviewSettings(nightReviewEnabled, time);
    } else if (editingTime) {
      let start = editingTime === "windowStart" ? time : habitReminderStart;
      let end = editingTime === "windowEnd" ? time : habitReminderEnd;
      // Keep the window valid by moving the other end if they cross
      if (start > end) {
        if (editingTime === "windowStart") end = start;
        else start = end;
      }
      await updateHabitReminderWindow(start, end);
    }
    await rescheduleAllNotifications();
  };

  const handleRequestPermissions = async () => {
    if (notificationPermissionStatus === "denied") {
      Linking.openSettings();
      return;
    }
    const isGranted = await requestNotificationPermissions();
    if (isGranted) {
      await rescheduleAllNotifications();
    } else {
      Alert.alert(
        "Notifications are off",
        "To get reminders, turn on notifications for Slate in Settings.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const pickInterval = () => {
    const intervals = [2, 3, 4, 6];
    const options = [...intervals.map((n) => `Every ${n} hours`), "Cancel"];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: "Remind me about habits",
        options,
        cancelButtonIndex: options.length - 1,
        userInterfaceStyle: isDark ? "dark" : "light",
        tintColor: colors.primary,
      },
      (index) => {
        if (index < intervals.length) handleHabitReminderIntervalChange(intervals[index]);
      }
    );
  };

  const currentTime = {
    planDay: planYourDayTime,
    nightReview: nightReviewTime,
    windowStart: habitReminderStart,
    windowEnd: habitReminderEnd,
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: bottomSpace }}
      >
        <View style={styles.header}>
          <ThemedText type="greeting" tone="textSecondary">
            Make it yours
          </ThemedText>
          <ThemedText type="display">Settings</ThemedText>
        </View>

        <View style={styles.content}>
          {!granted && (
            <Card elevation={2} style={styles.permission}>
              <View style={[styles.permissionIcon, { backgroundColor: colors.primarySoft }]}>
                <Icon name="bell" size={24} color="primary" weight="duotone" />
              </View>
              <View style={styles.flex}>
                <ThemedText type="heading">Turn on reminders</ThemedText>
                <ThemedText type="callout" tone="textSecondary">
                  {notificationPermissionStatus === "denied"
                    ? "Notifications are off for Slate. You can turn them on in iOS Settings."
                    : "A nudge to plan your morning, keep habits going, and wind down."}
                </ThemedText>
                <Button
                  title={notificationPermissionStatus === "denied" ? "Open Settings" : "Allow notifications"}
                  size="md"
                  onPress={handleRequestPermissions}
                  style={styles.permissionButton}
                />
              </View>
            </Card>
          )}

          <View>
            <SectionHeader title="Reminders" />
            <Card padded={false} clip>
              <Animated.View layout={LinearTransition}>
                <SettingRow
                  icon="sunHorizon"
                  tint={colors.primary}
                  tintSoft={colors.primarySoft}
                  title="Plan your day"
                  description="A morning nudge to pull tasks from the Slate into Today."
                  value={planYourDayEnabled}
                  onValueChange={handlePlanDayToggle}
                  disabled={!granted}
                />
                {planYourDayEnabled && (
                  <SubRow label="Remind me at" disabled={!granted}>
                    <TimePickerButton
                      time={planYourDayTime}
                      onPress={() => setEditingTime("planDay")}
                      disabled={!granted}
                    />
                  </SubRow>
                )}
              </Animated.View>

              <Divider />

              <Animated.View layout={LinearTransition}>
                <SettingRow
                  icon="leaf"
                  tint={colors.habit}
                  tintSoft={colors.habitSoft}
                  title="Habit reminders"
                  description="Gentle check-ins through the day, only while habits are left."
                  value={habitRemindersEnabled}
                  onValueChange={handleHabitReminderToggle}
                  disabled={!granted}
                />
                {habitRemindersEnabled && (
                  <>
                    <SubRow label="How often" disabled={!granted}>
                      <Button
                        title={`Every ${habitReminderInterval} hours`}
                        variant="secondary"
                        size="md"
                        haptics="selection"
                        onPress={pickInterval}
                        disabled={!granted}
                        style={styles.compactButton}
                      />
                    </SubRow>
                    <SubRow label="Between" disabled={!granted}>
                      <View style={styles.window}>
                        <TimePickerButton
                          time={habitReminderStart}
                          onPress={() => setEditingTime("windowStart")}
                          disabled={!granted}
                          compact
                        />
                        <ThemedText type="caption" tone="textTertiary">
                          to
                        </ThemedText>
                        <TimePickerButton
                          time={habitReminderEnd}
                          onPress={() => setEditingTime("windowEnd")}
                          disabled={!granted}
                          compact
                        />
                      </View>
                    </SubRow>
                  </>
                )}
              </Animated.View>

              <Divider />

              <Animated.View layout={LinearTransition}>
                <SettingRow
                  icon="moonStars"
                  tint={colors.streak}
                  tintSoft={colors.streakSoft}
                  title="Night review"
                  description="An evening look at what's left, and a chance to tidy the Slate."
                  value={nightReviewEnabled}
                  onValueChange={handleNightReviewToggle}
                  disabled={!granted}
                />
                {nightReviewEnabled && (
                  <SubRow label="Remind me at" disabled={!granted}>
                    <TimePickerButton
                      time={nightReviewTime}
                      onPress={() => setEditingTime("nightReview")}
                      disabled={!granted}
                    />
                  </SubRow>
                )}
              </Animated.View>
            </Card>
          </View>

          <VoiceSettings />

          <View>
            <SectionHeader title="About" />
            <Card padded={false} clip>
              <InfoRow
                icon="sun"
                title="New day starts at"
                value={formatTime(dayStart)}
                note="Late nights count as the day before."
              />
            </Card>
          </View>

          <DeveloperTools />

          <ThemedText type="greeting" tone="textTertiary" style={styles.signoff}>
            One day at a time.
          </ThemedText>
        </View>
      </ScrollView>

      {editingTime && (
        <TimePickerModal
          visible
          title={
            editingTime === "windowStart"
              ? "Reminders start"
              : editingTime === "windowEnd"
              ? "Reminders stop"
              : "Remind me at"
          }
          selectedTime={currentTime[editingTime]}
          onTimeSelect={handleTimeChange}
          onClose={() => setEditingTime(null)}
        />
      )}
    </Screen>
  );
}

function SettingRow({
  icon,
  tint,
  tintSoft,
  title,
  description,
  value,
  onValueChange,
  disabled,
}: {
  icon: IconName;
  tint: string;
  tintSoft: string;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, disabled && styles.dimmed]}>
      <View style={[styles.rowIcon, { backgroundColor: tintSoft }]}>
        <Icon name={icon} size={20} color={tint} weight="duotone" duotoneOpacity={0.35} />
      </View>
      <View style={styles.flex}>
        <ThemedText type="bodySemiBold">{title}</ThemedText>
        <ThemedText type="caption" tone="textSecondary">
          {description}
        </ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceSunken, true: tint }}
        ios_backgroundColor={colors.surfaceSunken}
        disabled={disabled}
      />
    </View>
  );
}

function SubRow({
  label,
  disabled,
  children,
}: {
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)}>
      <View style={[styles.subRow, disabled && styles.dimmed]}>
        <ThemedText type="callout" tone="textSecondary">
          {label}
        </ThemedText>
        {children}
      </View>
    </Animated.View>
  );
}

function InfoRow({
  icon,
  title,
  value,
  note,
}: {
  icon: IconName;
  title: string;
  value: string;
  note?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: colors.surfaceSunken }]}>
        <Icon name={icon} size={20} color="textSecondary" weight="duotone" />
      </View>
      <View style={styles.flex}>
        <ThemedText type="bodyMedium">{title}</ThemedText>
        {note && (
          <ThemedText type="caption" tone="textTertiary">
            {note}
          </ThemedText>
        )}
      </View>
      <ThemedText type="calloutMedium" tone="textSecondary">
        {value}
      </ThemedText>
    </View>
  );
}

function Divider() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  content: { paddingHorizontal: 16, gap: 28 },
  flex: { flex: 1, gap: 2 },
  permission: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  permissionIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionButton: { alignSelf: "flex-start", marginTop: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 68,
    paddingRight: 16,
    paddingBottom: 14,
    gap: 12,
  },
  window: { flexDirection: "row", alignItems: "center", gap: 6 },
  compactButton: { minHeight: 36, paddingHorizontal: 14 },
  dimmed: { opacity: 0.55 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
  signoff: { textAlign: "center", marginTop: 4 },
});
