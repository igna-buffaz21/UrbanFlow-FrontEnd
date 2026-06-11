import { useId, useEffect } from "react";
import { useMap } from "@/components/ui/map";

interface MapHeatmapLayerProps {
    points: { coordinates: [number, number]; priority: string }[];
    opacity?: number;
    radius?: number;
    intensity?: number;
}

const PRIORITY_WEIGHT: Record<string, number> = {
    critical: 1.0,
    high: 0.7,
    medium: 0.35,
    low: 0.1,
};

export function MapHeatmapLayer({
    points,
    opacity = 0.8,
    radius = 30,
    intensity = 1,
}: MapHeatmapLayerProps) {
    const { map, isLoaded } = useMap();
    const id = useId();
    const sourceId = `heatmap-source-${id}`;
    const layerId = `heatmap-layer-${id}`;

    useEffect(() => {
        if (!isLoaded || !map || points.length === 0) return;

        map.addSource(sourceId, {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: points.map(({ coordinates: [lng, lat], priority }) => ({
                    type: "Feature",
                    geometry: { type: "Point", coordinates: [lng, lat] },
                    properties: { weight: PRIORITY_WEIGHT[priority] ?? 0.35 },
                })),
            },
        });

        map.addLayer({
            id: layerId,
            type: "heatmap",
            source: sourceId,
            paint: {
                // Intensidad sube con el zoom
                "heatmap-intensity": [
                    "interpolate", ["linear"], ["zoom"],
                    0, intensity,
                    9, intensity * 3,
                ],
                // Color: azul → verde → amarillo → rojo
                "heatmap-color": [
                    "interpolate", ["linear"], ["heatmap-density"],
                    0, "rgba(33, 102, 172, 0)",
                    0.2, "rgb(103, 169, 207)",
                    0.4, "rgb(209, 229, 240)",
                    0.6, "rgb(253, 219, 99)",
                    0.8, "rgb(239, 138, 98)",
                    1, "rgb(178, 24, 43)",
                ],
                // Radio crece con el zoom
                "heatmap-radius": [
                    "interpolate", ["linear"], ["zoom"],
                    0, radius * 0.5,
                    9, radius,
                    15, radius * 2,
                ],
                "heatmap-opacity": opacity,
                "heatmap-weight": ["get", "weight"],
            },
        });

        return () => {
            try {
                if (map.getLayer(layerId)) map.removeLayer(layerId);
                if (map.getSource(sourceId)) map.removeSource(sourceId);
            } catch {
                // ignorar si ya fue eliminado
            }
        };
    }, [isLoaded, map, points, opacity, radius, intensity, sourceId, layerId]);

    return null;
}