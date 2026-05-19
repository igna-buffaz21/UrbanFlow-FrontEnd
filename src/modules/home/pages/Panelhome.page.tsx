// src/modules/panel/pages/PanelHomePage.tsx

import { useUser } from "@clerk/react";

export default function PanelHomePage() {
  const { user } = useUser();

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-bold">
        Bienvenido, {user?.firstName ?? "usuario"}
      </h1>

      <p className="text-muted-foreground">
        Seleccioná una opción del menú lateral para comenzar.
      </p>
    </section>
  );
}