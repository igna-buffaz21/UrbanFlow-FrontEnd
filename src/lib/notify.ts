// src/lib/notify.ts
import { toast } from "sonner";

export const notify = {
  default(message: string) {
    return toast(message);
  },

  success(message: string) {
    return toast.success(message);
  },

  info(message: string) {
    return toast.info(message);
  },

  warning(message: string) {
    return toast.warning(message);
  },

  error(message: string) {
    return toast.error(message);
  },

  loading(message: string) {
    return toast.loading(message);
  },

  promise<T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string;
    }
  ) {
    return toast.promise(promise, messages);
  },

  dismiss(toastId?: string | number) {
    return toast.dismiss(toastId);
  },
};