import * as Notifications from "expo-notifications";
import * as Updates from "expo-updates";

import { Alert, DevSettings, Share, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/ui/Icon";
import React, { useCallback, useEffect, useState } from "react";
import { count, eq } from "drizzle-orm";
import { habits, tasks } from "@/lib/db/schema";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Constants from "expo-constants";
import { Radius } from "@/constants/theme";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ThemedText } from "@/components/themed-text";
import { db } from "@/lib/db/connection";
import dayjs from "dayjs";
import { rescheduleAllNotifications } from "@/lib/services/notifications";
import { storage } from "@/lib/logic/rollover";
import { useAppStore } from "@/lib/stores/appStore";
import { useFocusEffect } from "expo-router";
import { useTheme } from "@/hooks/use-theme";
import { useTimeStore } from "@/lib/stores/timeStore";

type UpdateState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "downloading" }
  | { kind: "upToDate"; at: Date }
  | { kind: "ready" }
  | { kind: "error"; message: string }
  | { kind: "unavailable" };

interface Diagnostics {
  lastProcessed: string | null;
  openTasks: number;
  doneTasks: number;
  activeHabits: number;
  scheduledNotifications: number;
}

const appVersion = Constants.expoConfig?.version ?? "unknown";

function runningLabel() {
  if (__DEV__) return "Metro (development)";
  if (Updates.isEmbeddedLaunch || !Updates.updateId) return "Bundle built into the app";
  return `Update ${Updates.updateId.slice(0, 8)}`;
}

/** Version, update and data details for test builds; shown in every build */
export function DeveloperTools() {
  const { colors } = useTheme();
  const currentDate = useTimeStore((s) => s.currentDate);
  const [update, setUpdate] = useState<UpdateState>({ kind: "idle" });
  const [diag, setDiag] = useState<Diagnostics | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const loadDiagnostics = useCallback(async () => {
    try {
      const [lastProcessed, open, done, active, scheduled] = await Promise.all([
        storage.getItem("last_processed_date"),
        db.select({ n: count() }).from(tasks).where(eq(tasks.status, "open")),
        db.select({ n: count() }).from(tasks).where(eq(tasks.status, "done")),
        db.select({ n: count() }).from(habits).where(eq(habits.isActive, true)),
        Notifications.getAllScheduledNotificationsAsync(),
      ]);
      setDiag({
        lastProcessed,
        openTasks: open[0]?.n ?? 0,
        doneTasks: done[0]?.n ?? 0,
        activeHabits: active[0]?.n ?? 0,
        scheduledNotifications: scheduled.length,
      });
    } catch (e) {
      console.error("Failed to load diagnostics", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDiagnostics();
    }, [loadDiagnostics])
  );

  // A failed launch of a downloaded update falls back to the built-in bundle
  useEffect(() => {
    if (Updates.isEmergencyLaunch) {
      setUpdate({
        kind: "error",
        message: `Fell back to the built-in bundle: ${Updates.emergencyLaunchReason ?? "unknown reason"}`,
      });
    }
  }, []);

  const checkForUpdate = async () => {
    if (!Updates.isEnabled) {
      setUpdate({ kind: "unavailable" });
      return;
    }
    setUpdate({ kind: "checking" });
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        setUpdate({ kind: "upToDate", at: new Date() });
        return;
      }
      setUpdate({ kind: "downloading" });
      await Updates.fetchUpdateAsync();
      setUpdate({ kind: "ready" });
    } catch (e) {
      setUpdate({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  const reload = () => {
    if (__DEV__) DevSettings.reload();
    else Updates.reloadAsync().catch((e) => Alert.alert("Couldn't restart", String(e)));
  };

  const run = async (label: string, action: () => Promise<void>) => {
    setBusy(label);
    try {
      await action();
    } catch (e) {
      Alert.alert("Something went wrong", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      loadDiagnostics();
    }
  };

  const showUpdateLog = () =>
    run("log", async () => {
      const entries = await Updates.readLogEntriesAsync(24 * 60 * 60 * 1000);
      // Debug entries are mostly internal state-machine chatter
      const lines = entries
        .filter((e) => e.level !== "debug" && e.level !== "trace")
        .slice(-8)
        .map((e) => `${dayjs(e.timestamp).format("HH:mm")} ${e.level}: ${e.message}`);
      Alert.alert("Update log (last 24h)", lines.length ? lines.join("\n\n") : "No entries.");
    });

  const diagnosticsText = () =>
    [
      `Slate ${appVersion}`,
      `Runtime: ${Updates.runtimeVersion || "none"}`,
      `Channel: ${Updates.channel || "none"}`,
      `Running: ${runningLabel()}`,
      Updates.updateId ? `Update ID: ${Updates.updateId}` : null,
      Updates.createdAt ? `Published: ${dayjs(Updates.createdAt).format("YYYY-MM-DD HH:mm")}` : null,
      `Logical day: ${currentDate}`,
      `Last rollover: ${diag?.lastProcessed ?? "unknown"}`,
      diag &&
        `Data: ${diag.openTasks} open / ${diag.doneTasks} done tasks, ${diag.activeHabits} habits`,
      diag && `Scheduled notifications: ${diag.scheduledNotifications}`,
    ]
      .filter(Boolean)
      .join("\n");

  const status = (() => {
    switch (update.kind) {
      case "checking":
        return { text: "Checking for updates…", tone: colors.textSecondary };
      case "downloading":
        return { text: "Downloading the update…", tone: colors.textSecondary };
      case "upToDate":
        return { text: `Up to date · checked ${dayjs(update.at).format("h:mm A")}`, tone: colors.habit };
      case "ready":
        return { text: "Update downloaded. Restart to use it.", tone: colors.primary };
      case "error":
        return { text: update.message, tone: colors.error };
      case "unavailable":
        return { text: "Updates are off in development builds.", tone: colors.textSecondary };
      default:
        return null;
    }
  })();

  return (
    <View style={styles.wrap}>
      <SectionHeader title="Developer" />

      <Card padded={false} clip>
        <InfoRow icon="sparkle" label="Version" value={appVersion} />
        <Divider />
        <InfoRow icon="stack" label="Runtime" value={Updates.runtimeVersion || "–"} />
        <Divider />
        <InfoRow icon="link" label="Channel" value={Updates.channel || "none"} />
        <Divider />
        <InfoRow
          icon="database"
          label="Running"
          value={runningLabel()}
          note={
            Updates.createdAt && !Updates.isEmbeddedLaunch
              ? `Published ${dayjs(Updates.createdAt).format("MMM D, h:mm A")}`
              : undefined
          }
        />

        <View style={[styles.updateBox, { backgroundColor: colors.surfaceSunken }]}>
          {status && (
            <ThemedText type="callout" style={{ color: status.tone }}>
              {status.text}
            </ThemedText>
          )}
          {update.kind === "ready" ? (
            <Button title="Restart to update" icon="arrowRight" size="md" haptics="medium" onPress={reload} />
          ) : (
            <Button
              title="Check for updates"
              icon="sparkle"
              variant="secondary"
              size="md"
              loading={update.kind === "checking" || update.kind === "downloading"}
              onPress={checkForUpdate}
            />
          )}
        </View>
      </Card>

      <Card padded={false} clip>
        <InfoRow icon="sun" label="Logical day" value={dayjs(currentDate).format("ddd, MMM D")} />
        <Divider />
        <InfoRow
          icon="calendarCheck"
          label="Last rollover"
          value={diag?.lastProcessed ? dayjs(diag.lastProcessed).format("ddd, MMM D") : "–"}
          note="Rollover has caught up to this day"
        />
        <Divider />
        <InfoRow
          icon="listChecks"
          label="Data"
          value={diag ? `${diag.openTasks} open · ${diag.doneTasks} done` : "–"}
          note={diag ? `${diag.activeHabits} active habit${diag.activeHabits === 1 ? "" : "s"}` : undefined}
        />
        <Divider />
        <InfoRow
          icon="bell"
          label="Scheduled notifications"
          value={diag ? String(diag.scheduledNotifications) : "–"}
        />

        <View style={[styles.actions, { backgroundColor: colors.surfaceSunken }]}>
          <Button
            title="Reschedule"
            icon="bell"
            variant="secondary"
            size="md"
            loading={busy === "notifications"}
            onPress={() => run("notifications", rescheduleAllNotifications)}
          />
          <Button title="Update log" icon="note" variant="secondary" size="md" loading={busy === "log"} onPress={showUpdateLog} />
          <Button
            title="Share info"
            icon="arrowUpRight"
            variant="secondary"
            size="md"
            onPress={() => Share.share({ message: diagnosticsText() })}
          />
          <Button title="Restart app" icon="repeat" variant="secondary" size="md" onPress={reload} />
          {__DEV__ && (
            <Button
              title="Load demo data"
              icon="database"
              variant="secondary"
              size="md"
              loading={busy === "demo"}
              onPress={() =>
                Alert.alert("Load demo data?", "This replaces every task, habit and day of history.", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Replace",
                    style: "destructive",
                    onPress: () =>
                      run("demo", async () => {
                        const { seedDemoData } = await import("@/lib/dev/seed");
                        await seedDemoData(useTimeStore.getState().getCurrentDate());
                        await useAppStore.getState().refreshData();
                      }),
                  },
                ])
              }
            />
          )}
        </View>
      </Card>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  note,
}: {
  icon: IconName;
  label: string;
  value: string;
  note?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: colors.surfaceSunken }]}>
        <Icon name={icon} size={18} color="textSecondary" weight="duotone" />
      </View>
      <View style={styles.flex}>
        <ThemedText type="bodyMedium">{label}</ThemedText>
        {note && (
          <ThemedText type="caption" tone="textTertiary">
            {note}
          </ThemedText>
        )}
      </View>
      <ThemedText type="calloutMedium" tone="textSecondary" style={styles.value} numberOfLines={1}>
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
  wrap: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: { flex: 1, gap: 2 },
  value: { maxWidth: "55%", fontVariant: ["tabular-nums"] },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 64 },
  updateBox: { padding: 16, gap: 12, alignItems: "flex-start" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 16 },
});
