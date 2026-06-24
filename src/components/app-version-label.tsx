import { useEffect, useState } from "react";

type AppVersion = {
  version: string;
};

export function AppVersionLabel() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    async function loadVersion() {
      try {
        const response = await fetch("/version.json", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = (await response.json()) as AppVersion;

        if (data.version) {
          setVersion(data.version);
        }
      } catch {
        setVersion(null);
      }
    }

    loadVersion();
  }, []);

  if (!version) return null;

  return (
    <p className="text-center text-[11px] leading-none text-muted-foreground/70">
      Versión {version}
    </p>
  );
}
