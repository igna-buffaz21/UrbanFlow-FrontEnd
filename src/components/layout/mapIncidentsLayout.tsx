import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MarkerTooltip,
} from "@/components/ui/map";
import { Button } from "@/components/ui/button";
import { incidentsService } from "@/modules/incidents/incidents.service";
import { IncidentDetailDialog } from "../dialog-incident";
import { TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { MapIncident } from "@/modules/incidents/incidents.type";
import { notify } from "@/lib/notify";

type MapCenter = [number, number];

type MapIncidentLayoutProps = {
  refreshKey: number;
};

type IncidentPriority = "low" | "medium" | "high";
type IncidentStatus = "pending" | "in_review" | "resolved" | "rejected";

const DEFAULT_RADIUS = 1000;
const MAX_ACCEPTED_ACCURACY = 400;

function getPriorityLabel(priority: IncidentPriority) {
  const labels: Record<IncidentPriority, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
  };

  return labels[priority];
}

function getStatusLabel(status: IncidentStatus) {
  const labels: Record<IncidentStatus, string> = {
    pending: "Pendiente",
    in_review: "En revisión",
    resolved: "Resuelto",
    rejected: "Rechazado",
  };

  return labels[status];
}

function formatDistance(distance: number) {
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(2)} km`;
  }

  return `${Math.round(distance)} m`;
}

function getPriorityMarkerStyles(priority?: IncidentPriority) {
  const styles: Record<
    IncidentPriority,
    {
      bg: string;
      pulse: string;
    }
  > = {
    low: {
      bg: "bg-red-500",
      pulse: "bg-red-400/20",
    },
    medium: {
      bg: "bg-red-600",
      pulse: "bg-red-500/25",
    },
    high: {
      bg: "bg-red-700",
      pulse: "bg-red-600/30",
    },
  };

  return styles[priority ?? "low"];
}

function IncidentMarkerIcon({ priority }: { priority: IncidentPriority }) {
  const styles = getPriorityMarkerStyles(priority);

  return (
    <div className="relative flex items-center justify-center">
      {priority === "high" && (
        <div
          className={`absolute size-8 rounded-full animate-ping ${styles.pulse}`}
        />
      )}

      <div className="relative flex flex-col items-center">
        <div
          className={`relative z-10 flex size-7 items-center justify-center rounded-full border border-white shadow-md ${styles.bg}`}
        >
          <TriangleAlert className="size-3.5 text-white" strokeWidth={2.5} />
        </div>

        <div
          className={`-mt-1 size-2 rotate-45 border-r border-b border-white shadow-sm ${styles.bg}`}
        />
      </div>
    </div>
  );
}

export function MapIncidentLayout({ refreshKey }: MapIncidentLayoutProps) {
  const [center, setCenter] = useState<MapCenter | null>(null);
  const [zoom, setZoom] = useState(14);

  const [userLocation, setUserLocation] = useState<MapCenter | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(true);

  const [incidents, setIncidents] = useState<MapIncident[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(false);
  const [incidentsError, setIncidentsError] = useState<string | null>(null);

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    null
  );
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const radius = DEFAULT_RADIUS;

  function getUserLocation() {
    setIsGettingLocation(true);
    setLocationError(null);
    setUserLocation(null);
    setCenter(null);
    setIncidents([]);

    if (!navigator.geolocation) {
      setLocationError("Tu navegador no soporta geolocalización.");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        console.log("Ubicación obtenida:", {
          latitude,
          longitude,
          accuracy,
        });

        if (accuracy > MAX_ACCEPTED_ACCURACY) {
          setLocationError(
            "La ubicación obtenida no es precisa. Activá el GPS e intentá nuevamente."
          );
          setIsGettingLocation(false);
          return;
        }

        const currentLocation: MapCenter = [longitude, latitude];

        setUserLocation(currentLocation);
        setCenter(currentLocation);
        setZoom(15);
        setLocationError(null);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error);

        setLocationError(
          "No se pudo obtener tu ubicación actual. Revisá los permisos de ubicación."
        );

        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  useEffect(() => {
    getUserLocation();
  }, [refreshKey]);

  useEffect(() => {
    if (!userLocation) return;

    const currentLocation = userLocation;

    async function getIncidents() {
      try {
        setIsLoadingIncidents(true);
        setIncidentsError(null);

        const [lng, lat] = currentLocation;

        const response = await incidentsService.getIncidentsMap(
          lat.toString(),
          lng.toString(),
          radius.toString()
        );

        setIncidents(response);
      } catch (error) {
        console.error(error);
        setIncidentsError("No se pudieron cargar los incidentes.");
      } finally {
        setIsLoadingIncidents(false);
      }
    }

    getIncidents();
  }, [userLocation, radius, refreshKey]);

  const validIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      return (
        incident.location?.type === "Point" &&
        Array.isArray(incident.location.coordinates) &&
        incident.location.coordinates.length === 2
      );
    });
  }, [incidents]);

  function handleOpenIncidentDetail(incidentId: string) {
    setSelectedIncidentId(incidentId);
    setIsDetailDialogOpen(true);
  }

  if (isGettingLocation) {
    return (
      <div className="flex h-full items-center justify-center bg-background px-6">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-foreground">
            Obteniendo tu ubicación...
          </p>

          <p className="text-xs text-muted-foreground">
            Activá el GPS y aceptá los permisos de ubicación.
          </p>
        </div>
      </div>
    );
  }

  if (!center || !userLocation) {
    return (
      <div className="flex h-full items-center justify-center bg-background px-6">
        <div className="max-w-xs text-center space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              No pudimos obtener tu ubicación
            </p>

            <p className="text-xs text-muted-foreground">
              Para ver los incidentes cercanos, necesitás permitir el acceso a
              tu ubicación actual.
            </p>

            {locationError && (
              <p className="text-xs text-destructive">{locationError}</p>
            )}
          </div>

          <Button type="button" onClick={getUserLocation}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="relative w-full h-full overflow-hidden">
        <Map center={center} zoom={zoom}>
          <MapMarker longitude={userLocation[0]} latitude={userLocation[1]}>
            <MarkerContent>
              <div className="relative flex items-center justify-center">
                <div className="absolute size-8 rounded-full bg-primary opacity-30 animate-ping" />
                <div className="bg-primary size-4 rounded-full border-2 border-white shadow-lg" />
              </div>
            </MarkerContent>

            <MarkerTooltip>Tu ubicación actual</MarkerTooltip>

            <MarkerPopup>
              <div className="space-y-1">
                <p className="text-foreground font-medium">
                  Tu ubicación actual
                </p>
              </div>
            </MarkerPopup>
          </MapMarker>

          {validIncidents.map((incident) => {
            const [lng, lat] = incident.location.coordinates;

            return (
              <MapMarker key={incident.id} longitude={lng} latitude={lat}>
                <MarkerContent>
                  <IncidentMarkerIcon priority={incident.priority} />
                </MarkerContent>

                <MarkerTooltip>{incident.title}</MarkerTooltip>

                <MarkerPopup>
                  <div className="max-w-[260px] box-border space-y-3 overflow-hidden">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground break-words">
                        {incident.title}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        A {formatDistance(incident.distance)} de tu ubicación
                      </p>
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>
                        Prioridad:{" "}
                        <span className="font-medium text-foreground">
                          {getPriorityLabel(incident.priority)}
                        </span>
                      </p>

                      <p>
                        Estado:{" Abierto "}
                        <span className="font-medium text-foreground">
                          
                        </span>
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      className="w-full max-w-full box-border"
                      onClick={() => handleOpenIncidentDetail(incident.id)}
                    >
                      Ver mas
                    </Button>
                  </div>
                </MarkerPopup>
              </MapMarker>
            );
          })}
        </Map>

        {isLoadingIncidents && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-background/90 text-foreground text-xs px-3 py-1.5 rounded-full shadow border">
            Cargando incidentes...
          </div>
        )}

        {!isLoadingIncidents && (
          <div className="absolute top-3 right-3 z-10 bg-background/90 text-foreground text-xs px-3 py-1.5 rounded-full shadow border">
            {validIncidents.length} incidentes
          </div>
        )}

        {locationError && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-destructive/90 text-destructive-foreground text-xs px-3 py-1.5 rounded-full shadow">
            {locationError}
          </div>
        )}

        {incidentsError && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 bg-destructive/90 text-destructive-foreground text-xs px-3 py-1.5 rounded-full shadow">
            {incidentsError}
          </div>
        )}
      </div>

      <IncidentDetailDialog
        incidentId={selectedIncidentId}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
    </div>
  );
}