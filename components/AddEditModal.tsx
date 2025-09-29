import ActionSheet, {
  SheetManager,
  SheetProps,
} from "react-native-actions-sheet";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
// import { useSettingsStore } from '@/lib/stores/settings';
import { formatDate, fromLocalDateString } from "@/lib/utils/dateFormat";

import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/lib/stores/appStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useToast } from "@/components/ToastProvider";

type AddEditModalProps = SheetProps<"add-edit-modal">;

export default function AddEditModal({ sheetId, payload }: AddEditModalProps) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { mode, type: initialType, itemId } = payload || {};

  // Theme colors
  const backgroundColor = useThemeColor({}, "background");
  const backgroundSecondary = useThemeColor({}, "backgroundSecondary");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const textTertiaryColor = useThemeColor({}, "textTertiary");
  const primaryColor = useThemeColor({}, "primary");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const borderColor = useThemeColor({}, "border");
  const [itemType, setItemType] = useState<"task" | "habit">(
    initialType || "task"
  );
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [dependsOnTaskId, setDependsOnTaskId] = useState<string | null>(null);

  // Create styles with theme colors
  const styles = createStyles({
    backgroundColor,
    backgroundSecondary,
    textColor,
    textSecondaryColor,
    textTertiaryColor,
    primaryColor,
    successColor,
    errorColor,
    borderColor,
  });

  const {
    createTask,
    createHabit,
    updateTask,
    updateHabit,
    getTaskById,
    getHabitById,
    deleteTask,
    deleteHabit,
  } = useAppStore();

  // Load existing item data when editing
  useEffect(() => {
    if (mode === "edit" && itemId) {
      if (itemType === "task") {
        const task = getTaskById(itemId);
        if (task) {
          setTitle(task.title);
          setScheduledDate(task.scheduledFor || null);
          setDependsOnTaskId(task.dependsOnTaskId || null);
        }
      } else {
        const habit = getHabitById(itemId);
        if (habit) {
          setTitle(habit.title);
        }
      }
    }
  }, [mode, itemId, itemType, getTaskById, getHabitById]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    try {
      if (mode === "add") {
        if (itemType === "task") {
          await createTask({
            title: title.trim(),
            scheduledFor: scheduledDate || undefined,
            dependsOn: dependsOnTaskId || undefined,
          });
          showToast(`Task "${title.trim()}" created successfully!`);
        } else {
          await createHabit({
            title: title.trim(),
          });
          showToast(`Habit "${title.trim()}" created successfully!`);
        }
        //dont close the modal, just wipe the data (so it's easy to create a new task)
        setTitle("");
        setScheduledDate(null);
        setDependsOnTaskId(null);
        setItemType("task");
      } else if (mode === "edit" && itemId) {
        if (itemType === "task") {
          await updateTask(itemId, {
            title: title.trim(),
            scheduledFor: scheduledDate || undefined,
            dependsOn: dependsOnTaskId || undefined,
          });
        } else {
          await updateHabit(itemId, {
            title: title.trim(),
          });
        }

        SheetManager.hide(sheetId);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save item");
      console.error("Save error:", error);
    }
  };

  const handleDateSelect = (dateString: string | null) => {
    setScheduledDate(dateString);
  };

  const openDatePicker = () => {
    SheetManager.show("date-picker-sheet", {
      payload: {
        onDateSelect: handleDateSelect,
        selectedDate: scheduledDate,
        title: "Schedule For",
      },
    });
  };

  const handleDependencySelect = (taskId: string | null) => {
    setDependsOnTaskId(taskId);
  };

  const openDependencyPicker = () => {
    SheetManager.show("dependency-picker-sheet", {
      payload: {
        onDependencySelect: handleDependencySelect,
        currentTaskId: itemId,
        selectedDependencyId: dependsOnTaskId,
      },
    });
  };

  const getDependencyTaskName = () => {
    if (!dependsOnTaskId) return null;
    const dependencyTask = getTaskById(dependsOnTaskId);
    return dependencyTask?.title || "Unknown Task";
  };

  const handleDelete = async () => {
    if (!(mode === "edit" && itemId)) return;
    const itemLabel = itemType === "task" ? "task" : "habit";
    Alert.alert(
      "Delete",
      `Are you sure you want to delete this ${itemLabel}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (itemType === "task") {
                await deleteTask(itemId);
              } else {
                await deleteHabit(itemId);
              }
              SheetManager.hide(sheetId);
            } catch (error) {
              Alert.alert("Error", "Failed to delete item");
              console.error("Delete error:", error);
            }
          },
        },
      ]
    );
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
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter title..."
              placeholderTextColor="#999"
              autoFocus
            />
          </View>

          {/* Single Row Button Bar */}
          <View style={styles.section}>
            <View style={styles.buttonBarDivider} />
            <View style={styles.buttonBar}>
              {/* Type Toggle Button */}
              <TouchableOpacity
                style={[
                  styles.buttonBarButton,
                  styles.typeToggleButton,
                  mode === "edit" && styles.typeToggleButtonDisabled,
                ]}
                disabled={mode === "edit"}
                onPress={() =>
                  setItemType(itemType === "task" ? "habit" : "task")
                }
              >
                <View style={styles.buttonBarButtonContent}>
                  <Ionicons
                    name={
                      itemType === "task"
                        ? "checkmark-circle-outline"
                        : "repeat-outline"
                    }
                    size={16}
                    color="#fff"
                    style={styles.buttonBarButtonIcon}
                  />
                  <Text style={styles.typeToggleButtonText}>
                    {itemType === "task" ? "Task" : "Habit"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Task-specific Date Button */}
              {itemType === "task" && (
                <TouchableOpacity
                  style={styles.buttonBarButton}
                  onPress={openDatePicker}
                >
                  <View style={styles.buttonBarButtonContent}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={scheduledDate ? successColor : textTertiaryColor}
                      style={styles.buttonBarButtonIcon}
                    />
                    <Text style={styles.buttonBarButtonText}>
                      {scheduledDate
                        ? formatDate(fromLocalDateString(scheduledDate))
                        : "Date"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Task-specific Dependency Button */}
              {itemType === "task" && (
                <TouchableOpacity
                  style={[
                    styles.buttonBarButton,
                    dependsOnTaskId && styles.dependencyButtonSelected,
                  ]}
                  onPress={openDependencyPicker}
                >
                  <View style={styles.buttonBarButtonContent}>
                    <Ionicons
                      name="link-outline"
                      size={16}
                      color={dependsOnTaskId ? successColor : textTertiaryColor}
                      style={styles.buttonBarButtonIcon}
                    />
                    <Text
                      style={[
                        styles.buttonBarButtonText,
                        dependsOnTaskId && styles.dependencyLabelSelected,
                      ]}
                    >
                      {dependsOnTaskId ? getDependencyTaskName() : "Depends On"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.buttonBarDivider} />
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {mode === "add" ? "Add" : "Save"}{" "}
              {itemType === "task" ? "Task" : "Habit"}
            </Text>
          </TouchableOpacity>

          {mode === "edit" && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>
                Delete {itemType === "task" ? "Task" : "Habit"}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
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
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textColor,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textColor,
    },
    cancelButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    cancelText: {
      fontSize: 16,
      color: colors.textTertiaryColor,
    },
    content: {
      paddingHorizontal: 20,
    },
    section: {
      marginTop: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.textSecondaryColor,
      marginBottom: 8,
    },
    // Shared button bar button styles
    buttonBarButton: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.backgroundSecondary,
      alignSelf: "flex-start",
      minWidth: 80,
    },
    buttonBarButtonContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    buttonBarButtonIcon: {
      marginRight: 8,
    },
    buttonBarButtonText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.textTertiaryColor,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    typeToggleButton: {
      backgroundColor: colors.successColor,
      borderColor: colors.successColor,
      minWidth: 80,
    },
    typeToggleButtonDisabled: {
      backgroundColor: colors.textTertiaryColor,
      borderColor: colors.textTertiaryColor,
    },
    typeToggleButtonText: {
      fontSize: 12,
      fontWeight: "500",
      color: "#fff",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.textColor,
      backgroundColor: colors.backgroundColor,
    },
    textArea: {
      height: 80,
      textAlignVertical: "top",
    },
    dateValue: {
      fontSize: 14,
      fontWeight: "600",
    },
    dateValueSet: {
      color: colors.textColor,
    },
    dateValueEmpty: {
      color: colors.textTertiaryColor,
      fontStyle: "italic",
    },
    dependencyButtonSelected: {
      backgroundColor: colors.backgroundSecondary,
      borderColor: colors.successColor,
    },
    dependencyLabelSelected: {
      color: colors.successColor,
      fontWeight: "600",
    },
    saveButton: {
      backgroundColor: colors.successColor,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 30,
      marginBottom: 20,
    },
    saveButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    deleteButton: {
      backgroundColor: colors.errorColor,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 12,
      marginBottom: 20,
    },
    deleteButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    buttonBarDivider: {
      height: 1,
      backgroundColor: colors.borderColor,
      marginVertical: 16,
    },
    buttonBar: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
    },
  });
