import { COLORS, TEXT, UI } from "@/lib/constants/app";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { buttonStyles, inputStyles } from "@/lib/utils/styles";
import { formatDate, isDateValid } from "@/lib/utils/dateFormat";

import { ConfirmationDialog } from "./ConfirmationDialog";
import { CustomDatePicker } from "./CustomDatePicker";
import FloatingModal from "./FloatingModal";
import { ThemedText } from "./themed-text";
import { UnifiedAddModalProps } from "./types";

export const UnifiedAddModal: React.FC<UnifiedAddModalProps> = ({
  visible,
  type,
  title,
  dueDate,
  notes,
  isEditMode = false,
  onTypeChange,
  onTitleChange,
  onDueDateChange,
  onNotesChange,
  onSave,
  onCancel,
  onDelete,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  return (
    <FloatingModal visible={visible}>
      <ThemedText type="subtitle" style={styles.modalTitle}>
        {isEditMode
          ? `Edit ${type === "task" ? TEXT.TYPES.TASK : TEXT.TYPES.HABIT}`
          : `Add New ${type === "task" ? TEXT.TYPES.TASK : TEXT.TYPES.HABIT}`}
      </ThemedText>

      {/* Type Toggle - Only show in add mode */}
      {!isEditMode && (
        <View style={styles.typeToggleContainer}>
          <TouchableOpacity
            style={[
              styles.typeToggle,
              type === "task" && styles.typeToggleActive,
            ]}
            onPress={() => onTypeChange("task")}
          >
            <Text
              style={[
                styles.typeToggleText,
                type === "task" && styles.typeToggleTextActive,
              ]}
            >
              {TEXT.TYPES.TASK}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeToggle,
              type === "habit" && styles.typeToggleActive,
            ]}
            onPress={() => onTypeChange("habit")}
          >
            <Text
              style={[
                styles.typeToggleText,
                type === "habit" && styles.typeToggleTextActive,
              ]}
            >
              {TEXT.TYPES.HABIT}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Title Input */}
      <TextInput
        style={inputStyles.base}
        placeholder={`${
          type === "task" ? TEXT.TYPES.TASK : TEXT.TYPES.HABIT
        } title`}
        value={title}
        onChangeText={onTitleChange}
        autoFocus
      />

      {/* Notes Input - Only show in edit mode */}
      {isEditMode && onNotesChange && (
        <TextInput
          style={[inputStyles.base, styles.notesInput]}
          placeholder={TEXT.PLACEHOLDERS.NOTES}
          value={notes || ""}
          onChangeText={onNotesChange}
          multiline
          numberOfLines={3}
        />
      )}

      {/* Due Date Input (only for tasks) */}
      {type === "task" && (
        <View style={styles.dateContainer}>
          <ThemedText style={styles.dateLabel}>
            {TEXT.LABELS.DUE_DATE}
            <ThemedText style={styles.dateLabelOptional}>
              {" "}
              (optional)
            </ThemedText>
          </ThemedText>

          <TouchableOpacity
            style={[
              styles.dateButton,
              !isDateValid(dueDate) && styles.dateButtonInvalid,
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text
              style={[
                styles.dateButtonText,
                !dueDate && styles.dateButtonPlaceholder,
                !isDateValid(dueDate) && styles.dateButtonTextInvalid,
              ]}
            >
              {dueDate
                ? formatDate(dueDate)
                : TEXT.PLACEHOLDERS.NO_DATE_SELECTED}
            </Text>
          </TouchableOpacity>
          {!isDateValid(dueDate) && (
            <Text style={styles.dateErrorText}>
              {TEXT.MESSAGES.SELECT_FUTURE_DATE}
            </Text>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        {isEditMode && onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteConfirmation(true)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={buttonStyles.secondary} onPress={onCancel}>
          <Text style={buttonStyles.secondaryText}>{TEXT.ACTIONS.CANCEL}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            buttonStyles.primary,
            (!title.trim() || (type === "task" && !isDateValid(dueDate))) &&
              buttonStyles.disabled,
          ]}
          onPress={onSave}
          disabled={!title.trim() || (type === "task" && !isDateValid(dueDate))}
        >
          <Text
            style={[
              buttonStyles.primaryText,
              (!title.trim() || (type === "task" && !isDateValid(dueDate))) &&
                buttonStyles.disabledText,
            ]}
          >
            {isEditMode ? TEXT.ACTIONS.SAVE : TEXT.ACTIONS.ADD}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Date Picker Modal */}
      <CustomDatePicker
        visible={showDatePicker}
        selectedDate={dueDate}
        onDateSelect={onDueDateChange}
        onClose={() => setShowDatePicker(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        visible={showDeleteConfirmation}
        title={`Delete ${type === "task" ? TEXT.TYPES.TASK : TEXT.TYPES.HABIT}`}
        message={`Are you sure you want to delete "${title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        onConfirm={() => {
          onDelete?.();
          setShowDeleteConfirmation(false);
        }}
        onCancel={() => setShowDeleteConfirmation(false)}
      />
    </FloatingModal>
  );
};

const styles = StyleSheet.create({
  modalTitle: {
    marginBottom: 22,
    textAlign: "center",
  },
  typeToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 6,
    marginBottom: 24,
  },
  typeToggle: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  typeToggleActive: {
    backgroundColor: "#10B981",
  },
  typeToggleText: {
    fontSize: UI.FONT_SIZE.XL,
    fontWeight: "500",
    color: "#6B7280",
  },
  typeToggleTextActive: {
    color: "white",
  },
  notesInput: {
    height: 100,
    textAlignVertical: "top",
  },
  dateContainer: {
    marginTop: 20,
  },
  dateLabel: {
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "500",
    fontStyle: "italic",
    color: COLORS.TEXT.TERTIARY,
  },
  dateLabelOptional: {
    fontSize: 14,
    fontWeight: "500",
    fontStyle: "italic",
    color: COLORS.TEXT.TERTIARY,
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    height: 52,
  },
  dateButtonText: {
    fontSize: 18,
    color: COLORS.TEXT.SECONDARY,
  },
  dateButtonIcon: {
    fontSize: 18,
  },
  dateButtonPlaceholder: {
    color: COLORS.TEXT.TERTIARY,
  },
  dateButtonInvalid: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  dateButtonTextInvalid: {
    color: "#EF4444",
  },
  dateErrorText: {
    fontSize: 14,
    color: "#EF4444",
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
