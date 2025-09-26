import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";

import Modal from "react-native-modal";
import { modalStyles } from "@/lib/utils/styles";

const FloatingModal = ({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) => {
  return (
    <Modal isVisible={visible}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalView}
        >
          {children}
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalView: {
    backgroundColor: modalStyles.container.backgroundColor,
    borderRadius: modalStyles.container.borderRadius,
    maxWidth: modalStyles.container.maxWidth,
    width: modalStyles.container.width,
    maxHeight: modalStyles.container.maxHeight,

    padding: modalStyles.container.padding,
    justifyContent: "center",
    alignSelf: "center",
    shadowColor: modalStyles.container.shadowColor,
    shadowOffset: {
      width: modalStyles.container.shadowOffset.width,
      height: modalStyles.container.shadowOffset.height,
    },
    shadowOpacity: modalStyles.container.shadowOpacity,
    shadowRadius: modalStyles.container.shadowRadius,
    elevation: modalStyles.container.elevation,
  },
});
export default FloatingModal;
