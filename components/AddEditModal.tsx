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

type AddEditModalProps = SheetProps<"add-edit-modal">;

export default function AddEditModal({ sheetId, payload }: AddEditModalProps) {
  const insets = useSafeAreaInsets();
  const { mode, type: initialType, itemId } = payload || {};
  const [itemType, setItemType] = useState<"task" | "habit">(
    initialType || "task"
  );
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [dependsOnTaskId, setDependsOnTaskId] = useState<string | null>(null);

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
        } else {
          await createHabit({
            title: title.trim(),
          });
        }
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
      }

      // Close the modal
      SheetManager.hide(sheetId);
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
    <ActionSheet id={sheetId} gestureEnabled={true} safeAreaInsets={insets}>
      <View style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                      color={scheduledDate ? "#10B981" : "#6B7280"}
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
                      color={dependsOnTaskId ? "#10B981" : "#6B7280"}
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 16,
    color: "#6B7280",
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
    color: "#374151",
    marginBottom: 8,
  },
  // Shared button bar button styles
  buttonBarButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
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
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  typeToggleButton: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
    minWidth: 80,
  },
  typeToggleButtonDisabled: {
    backgroundColor: "#9CA3AF",
    borderColor: "#9CA3AF",
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
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#fff",
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
    color: "#111827",
  },
  dateValueEmpty: {
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  dependencyButtonSelected: {
    backgroundColor: "#F0FDF4",
    borderColor: "#10B981",
  },
  dependencyLabelSelected: {
    color: "#10B981",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#10B981",
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
    backgroundColor: "#EF4444",
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
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  buttonBar: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
});
