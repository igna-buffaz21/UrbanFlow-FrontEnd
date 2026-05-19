// src/modules/panel/pages/PanelHomePage.tsx

import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/react";
import { useAuth } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/config/app.routes";

export default function AppHomePage() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();

    async function handleLogout() {
    await signOut();
    navigate(APP_ROUTES.auth.login, { replace: true });
  }

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-bold">
        Bienvenido, {user?.firstName ?? "usuario"}
      </h1>

      <p className="text-muted-foreground">
        Seleccioná una opción del menú lateral para comenzar.
      </p>

      <Button variant="outline" onClick={handleLogout}>
        Cerrar sesión
      </Button>
    </section>
  );
}