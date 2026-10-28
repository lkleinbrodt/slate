import { Alert, StyleSheet, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Radius, Type } from "@/constants/theme";
import React, { useEffect, useRef, useState } from "react";
import { SheetManager, SheetProps } from "react-native-actions-sheet";
import { Sheet, SheetHeader } from "@/components/ui/Sheet";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { PressableScale } from "@/components/ui/PressableScale";
import { ThemedText } from "@/components/themed-text";
import { formatRelativeDay } from "@/lib/utils/dateFormat";
import { fromLocalDate } from "@/lib/logic/dates";
import { haptic } from "@/components/ui/PressableScale";
import { useAppStore } from "@/lib/stores/appStore";
import { useTheme } from "@/hooks/use-theme";

type AddEditModalProps = SheetProps<"add-edit-modal">;

export default function AddEditModal({ sheetId, payload }: AddEditModalProps) {
  const { mode, type: initialType, itemId } = payload || {};
  const { colors } = useTheme();

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
  // native modal that would cover anything rendered by the app behind it.
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  // A ref, not state: a second Return/tap can land before a re-render
  const isSavingRef = useRef(false);

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
      haptic("light");
      return;
    }
    // Ignore repeat submits while a save is in flight (avoids duplicate tasks)
    if (isSavingRef.current) return;
    isSavingRef.current = true;

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
    } finally {
      isSavingRef.current = false;
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
        title: "When will you do it?",
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
        title: "When is it due?",
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

  const isTask = itemType === "task";
  const today = getTodayDate();
  const noun = isTask ? "task" : "habit";

  return (
    <Sheet id={sheetId}>
      <SheetHeader
        sheetId={sheetId}
        eyebrow={mode === "add" ? "New" : isTask ? "Edit task" : "Edit habit"}
        title={mode === "add" ? (isTask ? "Something to do" : "A daily habit") : title || "Untitled"}
      />

      <View style={styles.content}>
        {mode === "add" && (
          <View style={[styles.segment, { backgroundColor: colors.surfaceSunken }]}>
            {(["task", "habit"] as const).map((kind) => {
              const active = itemType === kind;
              return (
                <PressableScale
                  key={kind}
                  onPress={() => setItemType(kind)}
                  haptics="selection"
                  style={[
                    styles.segmentItem,
                    active && { backgroundColor: colors.surfaceElevated },
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Icon
                    name={kind === "task" ? "checkCircle" : "repeat"}
                    size={16}
                    color={active ? (kind === "task" ? colors.primary : colors.habit) : colors.textTertiary}
                    weight={active ? "bold" : "regular"}
                  />
                  <ThemedText
                    type="calloutMedium"
                    tone={active ? "text" : "textTertiary"}
                  >
                    {kind === "task" ? "Task" : "Habit"}
                  </ThemedText>
                </PressableScale>
              );
            })}
          </View>
        )}

        <View style={[styles.inputs, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TextInput
            style={[styles.titleInput, { color: colors.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder={isTask ? "What needs doing?" : "What will you do each day?"}
            placeholderTextColor={colors.textTertiary}
            autoFocus
            returnKeyType="done"
            // Return saves; in add mode the keyboard stays up for the next one
            submitBehavior={mode === "add" ? "submit" : "blurAndSubmit"}
            onSubmitEditing={handleSave}
            selectionColor={colors.primary}
          />
          <View style={[styles.inputDivider, { backgroundColor: colors.border }]} />
          <View style={styles.notesRow}>
            <Icon name="note" size={16} color="textTertiary" />
            <TextInput
              style={[styles.notesInput, { color: colors.text }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add a note"
              placeholderTextColor={colors.textTertiary}
              multiline
              selectionColor={colors.primary}
            />
          </View>
        </View>

        {isTask && !isDoneTask && (
          <View style={styles.chips}>
            <Chip
              size="md"
              icon="calendar"
              tone="primary"
              filled={!!scheduledDate}
              label={scheduledDate ? dayLabel("Do", scheduledDate, today) : "Do date"}
              onPress={openDatePicker}
              onClear={scheduledDate ? () => setScheduledDate(null) : undefined}
            />
            <Chip
              size="md"
              icon="flag"
              tone={dueDate && dueDate < today ? "error" : "streak"}
              filled={!!dueDate}
              label={dueDate ? dayLabel("Due", dueDate, today) : "Due date"}
              onPress={openDueDatePicker}
              onClear={dueDate ? () => setDueDate(null) : undefined}
            />
            <Chip
              size="md"
              icon="link"
              tone="neutral"
              filled={!!dependsOnTaskId}
              label={dependsOnTaskId ? `After “${getDependencyTaskName()}”` : "Depends on"}
              onPress={openDependencyPicker}
              onClear={dependsOnTaskId ? () => setDependsOnTaskId(null) : undefined}
              style={styles.depChip}
            />
          </View>
        )}

        {!isTask && mode === "add" && (
          <ThemedText type="caption" tone="textTertiary" style={styles.hint}>
            Habits show up in Today every day and build a streak.
          </ThemedText>
        )}

        {lastAdded && (
          <Animated.View
            key={lastAdded}
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={[styles.lastAdded, { backgroundColor: colors.habitSoft }]}
          >
            <Icon name="checkCircle" size={16} color={colors.habit} weight="fill" />
            <ThemedText type="calloutMedium" style={[styles.flex, { color: colors.habit }]} numberOfLines={2}>
              {lastAdded}
            </ThemedText>
          </Animated.View>
        )}

        <Button
          title={mode === "add" ? `Add ${noun}` : "Save changes"}
          icon={mode === "add" ? "plus" : "check"}
          onPress={handleSave}
          haptics="medium"
          disabled={!title.trim()}
          style={styles.save}
        />

        {mode === "edit" && (
          <Button
            title={`Delete ${noun}`}
            icon="trash"
            variant="ghost"
            size="md"
            onPress={handleDelete}
            style={styles.delete}
          />
        )}
      </View>
    </Sheet>
  );
}

// "Do today", "Due Friday", "Do Oct 30"
function dayLabel(prefix: string, date: string, today: string) {
  const day = formatRelativeDay(date, today);
  return `${prefix} ${day === "Today" || day === "Tomorrow" ? day.toLowerCase() : day}`;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 16 },
  segment: {
    flexDirection: "row",
    borderRadius: Radius.pill,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: Radius.pill,
  },
  inputs: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  titleInput: {
    ...Type.bodyMedium,
    fontSize: 19,
    lineHeight: undefined,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  notesRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 6,
  },
  notesInput: {
    ...Type.callout,
    lineHeight: undefined,
    flex: 1,
    minHeight: 56,
    paddingTop: 0,
    textAlignVertical: "top",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  depChip: { maxWidth: "100%" },
  hint: { paddingHorizontal: 4 },
  lastAdded: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  flex: { flex: 1 },
  save: { marginTop: 4 },
  delete: { alignSelf: "center" },
});
