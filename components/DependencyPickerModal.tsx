import ActionSheet, {
  SheetManager,
  SheetProps,
} from "react-native-actions-sheet";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useAppStore } from "@/lib/stores/appStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "@/hooks/use-theme-color";

type DependencyPickerModalProps = SheetProps<"dependency-picker-sheet">;

export default function DependencyPickerModal({
  sheetId,
  payload,
}: DependencyPickerModalProps) {
  const insets = useSafeAreaInsets();
  const { onDependencySelect, currentTaskId, selectedDependencyId } =
    payload || {};

  const { slateTasks } = useAppStore();

  // Theme colors
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const textTertiaryColor = useThemeColor({}, "textTertiary");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const borderColor = useThemeColor({}, "border");
  const backgroundSecondary = useThemeColor({}, "backgroundSecondary");

  // Get all tasks except the current one being edited
  const availableTasks = slateTasks.filter(
    (task) => task.id !== currentTaskId && task.status === "open"
  );

  const handleDependencySelect = (taskId: string | null) => {
    onDependencySelect?.(taskId);
    SheetManager.hide(sheetId);
  };

  const handleCancel = () => {
    SheetManager.hide(sheetId);
  };

  // Create styles with theme colors
  const styles = createStyles({
    backgroundColor,
    textColor,
    textTertiaryColor,
    successColor,
    errorColor,
    borderColor,
    backgroundSecondary,
  });

  const renderTaskItem = ({ item: task }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.taskItem,
        selectedDependencyId === task.id && styles.selectedTaskItem,
      ]}
      onPress={() => handleDependencySelect(task.id)}
    >
      <View style={styles.taskContent}>
        <Text
          style={[
            styles.taskTitle,
            selectedDependencyId === task.id && styles.selectedTaskTitle,
          ]}
        >
          {task.title}
        </Text>
        {task.scheduledFor && (
          <Text style={styles.taskScheduled}>
            Scheduled: {new Date(task.scheduledFor).toLocaleDateString()}
          </Text>
        )}
      </View>
      {selectedDependencyId === task.id && (
        <Ionicons name="checkmark-circle" size={20} color={successColor} />
      )}
    </TouchableOpacity>
  );

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
          <Text style={styles.title}>Depends On</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => handleDependencySelect(null)}
              style={styles.clearButton}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {availableTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={48} color={textTertiaryColor} />
            <Text style={styles.emptyText}>No available tasks</Text>
            <Text style={styles.emptySubtext}>
              All tasks are either completed or this is the only task
            </Text>
          </View>
        ) : (
          <FlatList
            data={availableTasks}
            keyExtractor={(item) => item.id}
            renderItem={renderTaskItem}
            style={styles.taskList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ActionSheet>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.backgroundColor,
      maxHeight: "80%",
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
    taskList: {
      maxHeight: 400,
    },
    taskItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },
    selectedTaskItem: {
      backgroundColor: colors.backgroundSecondary,
    },
    taskContent: {
      flex: 1,
    },
    taskTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.textColor,
      marginBottom: 4,
    },
    selectedTaskTitle: {
      color: colors.successColor,
    },
    taskScheduled: {
      fontSize: 14,
      color: colors.textTertiaryColor,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "500",
      color: colors.textTertiaryColor,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textTertiaryColor,
      textAlign: "center",
      lineHeight: 20,
    },
  });
