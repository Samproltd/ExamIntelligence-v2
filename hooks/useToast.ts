import { useState } from "react";

type ToastType = "success" | "error" | "info";

interface ToastState {
  open: boolean;
  message: string;
  type: ToastType;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    type: "info",
  });

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({
      open: true,
      message,
      type,
    });
  };

  const hideToast = () => {
    setToast({
      ...toast,
      open: false,
    });
  };

  const showSuccess = (message: string) => {
    showToast(message, "success");
  };

  const showError = (message: string) => {
    showToast(message, "error");
  };

  const showInfo = (message: string) => {
    showToast(message, "info");
  };

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showInfo,
  };
};

export default useToast;
