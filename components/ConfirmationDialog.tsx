import {
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import Modal from "react-native-modal";
import React from "react";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { buttonStyles } from "@/lib/utils/styles";
import { useThemeColor } from "@/hooks/use-theme-color";

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onCancel}
      style={styles.modal}
      backdropOpacity={0.5}
    >
      <TouchableWithoutFeedback>
        <View style={styles.container}>
          <ThemedView style={[styles.dialog, { backgroundColor }]}>
            <ThemedText style={[styles.title, { color: textColor }]}>
              {title}
            </ThemedText>

            <ThemedText style={[styles.message, { color: textColor }]}>
              {message}
            </ThemedText>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[buttonStyles.secondary, styles.button]}
                onPress={onCancel}
              >
                <ThemedText style={buttonStyles.secondaryText}>
                  {cancelText}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  destructive ? styles.destructiveButton : buttonStyles.primary,
                  styles.button,
                ]}
                onPress={onConfirm}
              >
                <ThemedText
                  style={[
                    destructive
                      ? styles.destructiveButtonText
                      : buttonStyles.primaryText,
                  ]}
                >
                  {confirmText}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: "center",
    alignItems: "center",
    margin: 20,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    borderRadius: 16,
    padding: 24,
    minWidth: 280,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
  },
  destructiveButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  destructiveButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
