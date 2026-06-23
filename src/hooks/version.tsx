import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { RefreshCcw } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

type AppVersion = {
  version: string;
};

type AppVersionProviderProps = {
  children: ReactNode;
};

const VERSION_CHECK_INTERVAL = 60_000;

export function AppVersionProvider({ children }: AppVersionProviderProps) {
  const currentVersionRef = useRef<string | null>(null);
  const [isUpdateRequired, setIsUpdateRequired] = useState(false);

  useEffect(() => {
    async function checkVersion() {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = (await response.json()) as AppVersion;

        if (!data.version) return;

        if (!currentVersionRef.current) {
          currentVersionRef.current = data.version;
          return;
        }

        if (currentVersionRef.current !== data.version) {
          setIsUpdateRequired(true);
        }
      } catch {
        // Si falla la consulta, no hacemos nada.
      }
    }

    checkVersion();

    const intervalId = window.setInterval(
      checkVersion,
      VERSION_CHECK_INTERVAL
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  function handleReload() {
    window.location.reload();
  }

  return (
    <>
      {children}

      <Dialog open={isUpdateRequired}>
        <DialogContent
          showCloseButton={false}
          className="max-w-sm rounded-2xl p-0"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className="space-y-6 p-6">
            <DialogHeader className="space-y-3 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <RefreshCcw className="size-7" />
              </div>

              <DialogTitle className="text-xl">
                Nueva versión disponible
              </DialogTitle>

              <DialogDescription className="text-sm leading-relaxed">
                Hay una actualización importante de la aplicación. Para seguir
                usando la plataforma, necesitás recargar y obtener la última
                versión.
              </DialogDescription>
            </DialogHeader>

            <Button className="h-11 w-full" onClick={handleReload}>
              Actualizar ahora
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}