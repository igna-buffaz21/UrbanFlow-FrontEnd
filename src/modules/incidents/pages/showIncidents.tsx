import { useState } from "react";
import { MapIncidentLayout } from "@/components/layout/mapIncidentsLayout";
import { RegisterIncidentDialog } from "@/components/register-incident-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/config/app.routes";
import { AlertTriangle, LogOut, Plus } from "lucide-react";

export function ShowIncidents() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    navigate(APP_ROUTES.auth.login, { replace: true });
  }

  return (
    <div className="relative flex flex-col h-dvh bg-background">

      <header className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-primary" />
          <span className="font-semibold text-sm tracking-tight">Incidentes</span>
          <Badge variant="secondary" className="text-xs">En vivo</Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="size-4" />
        </Button>
      </header>

      <div className="flex-1 overflow-hidden">
        <MapIncidentLayout />
      </div>

      <div className="absolute bottom-6 right-4 z-20">
        <Button
          size="lg"
          onClick={() => setDialogOpen(true)}
          className="rounded-full h-14 w-14 shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-200"
        >
          <Plus className="size-6" />
          <span className="sr-only">Registrar incidente</span>
        </Button>
      </div>

      <RegisterIncidentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}