import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
} from "@/components/ui/map";
import { MapPin } from "lucide-react";

export type MapCenter = [number, number]; // [lng, lat]

type IncidentLocationPickerMapProps = {
  value: MapCenter;
  onChange: (value: MapCenter) => void;
};

export function IncidentLocationPickerMap({
  value,
  onChange,
}: IncidentLocationPickerMapProps) {
  const [lng, lat] = value;

  return (
    <div className="h-[280px] w-full overflow-hidden rounded-xl border">
      <Map center={value} zoom={16}>
        <MapControls />

        <MapMarker
          draggable
          longitude={lng}
          latitude={lat}
          onDrag={(lngLat) => {
            onChange([lngLat.lng, lngLat.lat]);
          }}
        >
          <MarkerContent>
            <div className="cursor-move">
              <MapPin
                size={34}
                className="fill-red-600 text-white drop-shadow-md"
              />
            </div>
          </MarkerContent>

          <MarkerPopup>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Ubicación del incidente
              </p>

              <p className="text-xs text-muted-foreground">
                Mové el marcador para ajustar la ubicación.
              </p>

              <p className="text-xs text-muted-foreground tabular-nums">
                Lat: {lat.toFixed(6)}
              </p>

              <p className="text-xs text-muted-foreground tabular-nums">
                Lng: {lng.toFixed(6)}
              </p>
            </div>
          </MarkerPopup>
        </MapMarker>
      </Map>
    </div>
  );
}