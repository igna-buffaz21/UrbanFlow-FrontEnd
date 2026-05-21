// src/components/ui/app-loading.tsx

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

type AppLoadingProps = {
  title?: string;
  description?: string;
};

export function AppLoading({
  title = "Cargando aplicación",
  description = "Estamos preparando todo...",
}: AppLoadingProps) {
  const [progress, setProgress] = useState(20);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <Progress value={progress} className="w-full" />
      </div>
    </div>
  );
}