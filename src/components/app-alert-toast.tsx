import { useEffect, useState } from "react";
import { AlertCircleIcon, CheckCircle2Icon, InfoIcon, XIcon } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import { Button } from "@/components/ui/button";

type ToastType = "success" | "error" | "info";

type ToastState = {
  type: ToastType;
  message: string;
} | null;

export function useAppToast() {
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  function success(message: string) {
    setToast({
      type: "success",
      message,
    });
  }

  function error(message: string) {
    setToast({
      type: "error",
      message,
    });
  }

  function info(message: string) {
    setToast({
      type: "info",
      message,
    });
  }

  function close() {
    setToast(null);
  }

  function Toast() {
    if (!toast) return null;

    const isSuccess = toast.type === "success";
    const isError = toast.type === "error";
    const isInfo = toast.type === "info";

    return (
      <div className="fixed right-4 top-4 z-[9999] w-[calc(100%-2rem)] max-w-md animate-in fade-in slide-in-from-top-3">
        <Alert
          variant={isError ? "destructive" : "default"}
          className={
            isSuccess
              ? "border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-50"
              : isInfo
                ? "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-50"
                : ""
          }
        >
          {isSuccess && <CheckCircle2Icon className="size-4" />}
          {isError && <AlertCircleIcon className="size-4" />}
          {isInfo && <InfoIcon className="size-4" />}

          <AlertTitle>
            {isSuccess && "Éxito"}
            {isError && "Error"}
            {isInfo && "Información"}
          </AlertTitle>

          <AlertDescription>{toast.message}</AlertDescription>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={close}
            className="absolute right-2 top-2 h-7 w-7"
          >
            <XIcon className="size-4" />
            <span className="sr-only">Cerrar alerta</span>
          </Button>
        </Alert>
      </div>
    );
  }

  return {
    Toast,
    success,
    error,
    info,
  };
}