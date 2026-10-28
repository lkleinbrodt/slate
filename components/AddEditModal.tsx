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
import { fromLocalDate } from "@/lib/logic/dates";
import { useAppStore } from "@/lib/stores/appStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "@/hooks/use-theme-color";

type AddEditModalProps = SheetProps<"add-edit-modal">;

export default function AddEditModal({ sheetId, payload }: AddEditModalProps) {
  const insets = useSafeAreaInsets();
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
  const [notes, setNotes] = useState("");
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [dependsOnTaskId, setDependsOnTaskId] = useState<string | null>(null);
  // Done tasks only get title/notes/delete: moving their dates would rewrite history
  const [isDoneTask, setIsDoneTask] = useState(false);
  // Confirmation for the last item added. Shown inline because the sheet is a
  // native modal, which covers the app-level toast.
  const [lastAdded, setLastAdded] = useState<string | null>(null);

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
    getTodayDate,
  } = useAppStore();

  // Load existing item data when editing. Keyed on the payload only: if it
  // also depended on itemType, toggling Task/Habit in add mode would re-run the
  // reset below and flip the toggle straight back.
  useEffect(() => {
    if (mode === "edit" && itemId) {
      if (initialType !== "habit") {
        const task = getTaskById(itemId);
        if (task) {
          setTitle(task.title);
          setNotes(task.notes ?? "");
          setScheduledDate(task.scheduledFor || null);
          setDueDate(task.dueDate || null);
          setDependsOnTaskId(task.dependsOnTaskId || null);
          setIsDoneTask(task.status === "done");
        }
      } else {
        const habit = getHabitById(itemId);
        if (habit) {
          setTitle(habit.title);
          setNotes(habit.notes ?? "");
        }
      }
    } else if (mode === "add") {
      // Clear state for new item
      setTitle("");
      setNotes("");
      setScheduledDate(null);
      setDueDate(null);
      setDependsOnTaskId(null);
      setItemType(initialType || "task");
    }
  }, [mode, itemId, initialType, getTaskById, getHabitById]);

  const describeNewTask = (task: { title: string; scheduledFor: string | null }) => {
    const today = getTodayDate();
    if (!task.scheduledFor) return `Added "${task.title}" to the Slate`;
    if (task.scheduledFor <= today) return `Added "${task.title}" to Today`;
    return `Added "${task.title}" for ${fromLocalDate(task.scheduledFor).format("ddd, MMM D")}`;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    try {
      if (mode === "add") {
        if (itemType === "task") {
          const task = await createTask({
            title: title.trim(),
            notes: notes.trim() || undefined,
            scheduledFor: scheduledDate || undefined,
            dueDate: dueDate || undefined,
            dependsOn: dependsOnTaskId || undefined,
          });
          setLastAdded(describeNewTask(task));
        } else {
          await createHabit({
            title: title.trim(),
            notes: notes.trim() || undefined,
          });
          setLastAdded(`Added habit "${title.trim()}"`);
        }
        // Don't close the modal, just wipe the data (so it's easy to add another
        // of the same kind)
        setTitle("");
        setNotes("");
        setScheduledDate(null);
        setDueDate(null);
        setDependsOnTaskId(null);
      } else if (mode === "edit" && itemId) {
        if (itemType === "task") {
          // Pass null (not undefined) so cleared fields are actually cleared
          await updateTask(itemId, {
            title: title.trim(),
            notes: notes.trim() || null,
            scheduledFor: scheduledDate,
            dueDate,
            dependsOnTaskId,
          });
        } else {
          await updateHabit(itemId, {
            title: title.trim(),
            notes: notes.trim() || null,
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
        title: "Do Date",
        // Past do-dates would never roll into Today
        minDate: getTodayDate(),
      },
    });
  };

  const openDueDatePicker = () => {
    SheetManager.show("date-picker-sheet", {
      payload: {
        onDateSelect: setDueDate,
        selectedDate: dueDate,
        title: "Due Date",
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
              returnKeyType={mode === "add" ? "next" : "done"}
              // Return saves; in add mode the keyboard stays up for the next one
              submitBehavior={mode === "add" ? "submit" : "blurAndSubmit"}
              onSubmitEditing={handleSave}
            />
          </View>

          {/* Notes Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional details..."
              placeholderTextColor="#999"
              multiline
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
              {itemType === "task" && !isDoneTask && (
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
                        ? `Do ${formatDate(fromLocalDateString(scheduledDate), "due")}`
                        : "Do date"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Task-specific Due Date Button */}
              {itemType === "task" && !isDoneTask && (
                <TouchableOpacity
                  style={styles.buttonBarButton}
                  onPress={openDueDatePicker}
                >
                  <View style={styles.buttonBarButtonContent}>
                    <Ionicons
                      name="flag-outline"
                      size={16}
                      color={dueDate ? successColor : textTertiaryColor}
                      style={styles.buttonBarButtonIcon}
                    />
                    <Text style={styles.buttonBarButtonText}>
                      {dueDate
                        ? `Due ${formatDate(fromLocalDateString(dueDate), "due")}`
                        : "Due date"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Task-specific Dependency Button */}
              {itemType === "task" && !isDoneTask && (
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

          {lastAdded && (
            <View style={styles.lastAdded}>
              <Ionicons name="checkmark-circle" size={16} color={successColor} />
              <Text style={styles.lastAddedText} numberOfLines={2}>
                {lastAdded}
              </Text>
            </View>
          )}

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
    lastAdded: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 20,
    },
    lastAddedText: {
      flex: 1,
      fontSize: 14,
      color: colors.textSecondaryColor,
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
      flexWrap: "wrap",
      gap: 12,
      alignItems: "center",
    },
  });
