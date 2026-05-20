import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MarkerTooltip,
} from "@/components/ui/map";
import { useEffect, useState } from "react";

type MapCenter = [number, number];

export function MapIncidentLayout() {
  const [center, setCenter] = useState<MapCenter>([-74.006, 40.7128]);
  const [zoom, setZoom] = useState(11);
  const [userLocation, setUserLocation] = useState<MapCenter | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Tu navegador no soporta geolocalización.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentLocation: MapCenter = [longitude, latitude];
        setCenter(currentLocation);
        setUserLocation(currentLocation);
        setZoom(15);
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error);
        setLocationError("No se pudo obtener tu ubicación actual.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  return (
    <div className="relative w-full h-[60vh] min-h-[320px] rounded-2xl overflow-hidden shadow-md">
      <Map key={`${center[0]}-${center[1]}`} center={center} zoom={zoom}>
        <MapControls />

        {userLocation && (
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
                <p className="text-foreground font-medium">Tu ubicación actual</p>
                <p className="text-muted-foreground text-xs">
                  Lat: {userLocation[1].toFixed(6)}
                </p>
                <p className="text-muted-foreground text-xs">
                  Lng: {userLocation[0].toFixed(6)}
                </p>
              </div>
            </MarkerPopup>
          </MapMarker>
        )}
      </Map>

      {locationError && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-destructive/90 text-destructive-foreground text-xs px-3 py-1.5 rounded-full shadow">
          {locationError}
        </div>
      )}
    </div>
  );
}