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

  // Cada vez que cambia este valor, el mapa se refresca
  const [refreshKey, setRefreshKey] = useState(0);

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
    <div className="relative flex h-full flex-col bg-background">
      <header className="z-10 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center">
          <img
            src="/logo3.png"
            alt="UrbanFlow"
            className="h-10 w-auto object-contain"
          />
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
        <MapIncidentLayout refreshKey={refreshKey} />
      </div>

    <div className="absolute bottom-10 right-2 z-20">
      <Button
        size="icon"
        onClick={() => setIsCreateIncidentOpen(true)}
        className="h-14 w-14 rounded-2xl shadow-md transition-all duration-200 hover:scale-105"
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
          setRefreshKey((prev) => prev + 1);
        }}
      />
    </div>
  );
}