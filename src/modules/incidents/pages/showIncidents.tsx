import { useEffect, useState } from "react";
import { MapIncidentLayout } from "@/components/layout/mapIncidentsLayout";
import { CreateIncidentDialog } from "@/components/register-incident-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/config/app.routes";
import { AlertTriangle, LogOut, Plus } from "lucide-react";

type MapCenter = [number, number]; // [lng, lat]

export function ShowIncidents() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [isCreateIncidentOpen, setIsCreateIncidentOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<MapCenter | null>(null);

  async function handleLogout() {
    await signOut();
    navigate(APP_ROUTES.auth.login, { replace: true });
  }

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setUserLocation([longitude, latitude]);
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  return (
    <div className="relative flex h-dvh flex-col bg-background">
      <header className="z-10 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-primary" />

          <span className="text-sm font-semibold tracking-tight">
            Incidentes
          </span>

          <Badge variant="secondary" className="text-xs">
            En vivo
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-muted-foreground transition-colors hover:text-destructive"
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
          onClick={() => setIsCreateIncidentOpen(true)}
          className="h-14 w-14 rounded-full shadow-xl shadow-primary/30 transition-all duration-200 hover:scale-105 hover:shadow-primary/50"
        >
          <Plus className="size-6" />
          <span className="sr-only">Registrar incidente</span>
        </Button>
      </div>

      <CreateIncidentDialog
        open={isCreateIncidentOpen}
        onOpenChange={setIsCreateIncidentOpen}
        defaultLocation={userLocation}
        onCreated={() => {
          // Idealmente acá refrescás los incidentes del mapa.
          // Por ahora podés dejarlo vacío.
        }}
      />
    </div>
  );
}