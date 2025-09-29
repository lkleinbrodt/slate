import React, { createContext, useCallback, useContext, useState } from "react";
import { Toast, ToastProps } from "./Toast";

interface ToastContextType {
  showToast: (
    message: string,
    type?: ToastProps["type"],
    duration?: number
  ) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastProps["type"];
    duration: number;
  }>({
    visible: false,
    message: "",
    type: "success",
    duration: 2000,
  });

  const showToast = useCallback(
    (
      message: string,
      type: ToastProps["type"] = "success",
      duration: number = 2000
    ) => {
      setToast({
        visible: true,
        message,
        type,
        duration,
      });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
