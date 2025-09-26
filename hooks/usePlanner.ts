/**
 * Custom hook for managing the main planner screen state and business logic
 * Centralizes all state management and actions for the main screen
 */

import { useCallback, useEffect, useMemo } from "react";

import { Alert } from "react-native";
import { localToday } from "@/lib/utils/clock";
import { useSettingsStore } from "@/lib/stores/settings";
import { useSlateStore } from "@/lib/stores/slateStore";

export function usePlanner() {
  // Unified slate store
  const tasks = useSlateStore((s) => s.tasks);
  const habits = useSlateStore((s) => s.habits);
  const isInitialized = useSlateStore((s) => s.isInitialized);
  const {
    init,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    toggleTaskForToday,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
  } = useSlateStore((s) => s.actions);

  // Settings
  const dayStart = useSettingsStore((state) => state.dayStart);

  // Initial data loading effect
  useEffect(() => {
    if (!isInitialized) init();
  }, [isInitialized, init]);

  // Memoized calculations
  const slateTasks = useMemo(() => {
    return tasks
      .filter((task) => !task.isToday)
      .slice() // Create a shallow copy before sorting
      .sort((a, b) => {
        const aHasDue = !!a.dueDate;
        const bHasDue = !!b.dueDate;
        if (aHasDue && bHasDue)
          return a.dueDate! < b.dueDate! ? -1 : a.dueDate! > b.dueDate! ? 1 : 0;
        if (aHasDue && !bHasDue) return -1;
        if (!aHasDue && bHasDue) return 1;
        return 0;
      });
  }, [tasks]);

  // Action Handlers
  const saveItem = useCallback(
    async (itemData: {
      isEditing: boolean;
      type: "task" | "habit";
      id?: string;
      title: string;
      notes?: string;
      dueDate?: Date;
    }) => {
      const { isEditing, type, id, title, notes, dueDate } = itemData;

      if (!title.trim()) return;

      try {
        if (isEditing && id) {
          // Handle edit mode
          if (type === "task") {
            await updateTask(id, {
              title: title.trim(),
              notes: notes?.trim() || undefined,
              dueDate: dueDate || null,
            });
          } else {
            await updateHabit(id, {
              title: title.trim(),
            });
          }
        } else {
          // Handle add mode
          if (type === "task") {
            await createTask(title.trim(), notes?.trim(), dueDate || null);
          } else {
            await createHabit(title.trim());
          }
        }
      } catch (error) {
        console.error(
          `Failed to ${isEditing ? "update" : "add"} ${type}:`,
          error
        );
        Alert.alert(
          "Error",
          `Failed to ${isEditing ? "update" : "add"} ${type}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
    [createTask, createHabit, updateTask, updateHabit]
  );

  const addItemToToday = useCallback(
    async (type: "task" | "habit", id: string) => {
      try {
        if (type === "task") {
          await toggleTaskForToday(id);
        }
      } catch (error) {
        console.error("Failed to add to today:", error);
        Alert.alert("Error", "Failed to add to today");
      }
    },
    [toggleTaskForToday]
  );

  const removeItemFromToday = useCallback(
    async (type: "task" | "habit", id: string) => {
      try {
        if (type === "task") {
          await toggleTaskForToday(id);
        }
      } catch (error) {
        console.error("Failed to remove from today:", error);
        Alert.alert("Error", "Failed to remove from today");
      }
    },
    [toggleTaskForToday]
  );

  const deleteItem = useCallback(
    async (type: "task" | "habit", id: string) => {
      try {
        if (type === "task") {
          await deleteTask(id);
        } else {
          await deleteHabit(id);
        }
      } catch (error) {
        console.error(`Failed to delete ${type}:`, error);
        Alert.alert("Error", `Failed to delete ${type}`);
      }
    },
    [deleteTask, deleteHabit]
  );

  // Return a clean API for the UI component
  return {
    // Data and State
    isLoading: !isInitialized,
    dayStart,
    currentDayPlan: {
      date: localToday(dayStart),
      perfectDay: false,
      tasks: tasks.filter((t) => t.isToday),
      habits,
      completedTasks: tasks.filter((t) => t.isToday && t.isDone),
      completedHabits: habits.filter((h) => h.isDoneToday),
    },
    tasks,
    habits,
    slateTasks,

    // Actions
    actions: {
      saveItem,
      addItemToToday,
      removeItemFromToday,
      deleteItem,
      completeTask: (taskId: string, _completed: boolean) =>
        toggleTaskCompletion(taskId),
      completeHabit: (habitId: string, _date: string) =>
        toggleHabitCompletion(habitId),
    },
  };
}
