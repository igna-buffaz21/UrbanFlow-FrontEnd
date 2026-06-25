import { useId, useEffect, useRef } from "react";
import { useMap } from "@/components/ui/map";
import MapLibreGL from "maplibre-gl";


interface HeatmapPoint {
    coordinates: [number, number];
    priority: string;
    id: string;
    title: string;
    status: string;
}

interface MapHeatmapLayerProps {
    points: HeatmapPoint[];
    opacity?: number;
    radius?: number;
    intensity?: number;
    onPointHover?: (point: HeatmapPoint | null, screenPos?: { x: number; y: number }) => void;
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
    radius = 18,
    intensity = 1,
    onPointHover,
}: MapHeatmapLayerProps) {
    const { map, isLoaded } = useMap();
    const id = useId();
    const sourceId = `heatmap-source-${id}`;
    const layerId = `heatmap-layer-${id}`;
    const pointsSourceId = `heatmap-points-source-${id}`;
    const pointsLayerId = `heatmap-points-layer-${id}`;
    const onPointHoverRef = useRef(onPointHover);
    onPointHoverRef.current = onPointHover;

    useEffect(() => {
        if (!isLoaded || !map || points.length === 0) return;

        // Fuente y capa del heatmap
        map.addSource(sourceId, {
            type: "geojson", data: {
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
                "heatmap-intensity": [
                    "interpolate", ["linear"], ["zoom"],
                    0, intensity,
                    9, intensity * 3,
                    15, intensity * 1.5,
                ],
                "heatmap-color": [
                    "interpolate", ["linear"], ["heatmap-density"],
                    0, "rgba(0, 0, 255, 0)",
                    0.1, "rgba(0, 0, 255, 0)",
                    0.15, "rgba(65, 105, 225, 0.4)",
                    0.4, "rgb(253, 219, 99)",
                    0.7, "rgb(239, 138, 98)",
                    1, "rgb(178, 24, 43)",
                ],
                "heatmap-radius": [
                    "interpolate", ["linear"], ["zoom"],
                    0, radius * 0.5,
                    9, radius,
                    14, radius * 2.5,
                    17, radius * 4,
                ],
                "heatmap-opacity": opacity,
                "heatmap-weight": ["get", "weight"],
            },
        });

        // Fuente y capa de puntos invisibles para interactividad
        map.addSource(pointsSourceId, {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: points.map(({ coordinates: [lng, lat], priority, id, title, status }) => ({
                    type: "Feature" as const,
                    geometry: { type: "Point", coordinates: [lng, lat] },
                    properties: { priority, id, title, status },
                })),
            },
        });

        map.addLayer({
            id: pointsLayerId,
            type: "circle",
            source: pointsSourceId,
            paint: {
                "circle-radius": 8,
                "circle-color": "rgba(0,0,0,0)",  // invisible
                "circle-stroke-width": 0,
            },
        });

        // Eventos hover
        const handleMouseMove = (e: MapLibreGL.MapLayerMouseEvent) => {
            const feature = e.features?.[0];
            if (!feature) return;
            map.getCanvas().style.cursor = "pointer";
            const props = feature.properties;
            if (props && onPointHoverRef.current) {
                onPointHoverRef.current(
                    {
                        coordinates: [e.lngLat.lng, e.lngLat.lat] as [number, number],                        priority: props.priority,
                        id: props.id,
                        title: props.title,
                        status: props.status,
                    },
                    { x: e.point.x, y: e.point.y }
                );
            }
        };

        const handleMouseLeave = () => {
            map.getCanvas().style.cursor = "";
            onPointHoverRef.current?.(null);
        };

        map.on("mousemove", pointsLayerId, handleMouseMove);
        map.on("mouseleave", pointsLayerId, handleMouseLeave);

        return () => {
            try {
                map.off("mousemove", pointsLayerId, handleMouseMove);
                map.off("mouseleave", pointsLayerId, handleMouseLeave);
                if (map.getLayer(pointsLayerId)) map.removeLayer(pointsLayerId);
                if (map.getSource(pointsSourceId)) map.removeSource(pointsSourceId);
                if (map.getLayer(layerId)) map.removeLayer(layerId);
                if (map.getSource(sourceId)) map.removeSource(sourceId);
            } catch { }
        };
    }, [isLoaded, map, points, opacity, radius, intensity, sourceId, layerId, pointsSourceId, pointsLayerId]);

    return null;
}