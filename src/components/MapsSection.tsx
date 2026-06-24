import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { districtsService, subDistrictsService } from "@/modules/districts/district.service";
import { incidentsService } from "@/modules/incidents/incidents.service";
import { useAuthUser } from "@/modules/auth/auth.context";
import {
    Map,
    MapControls,
    MapMarker,
    MarkerContent,
    MarkerTooltip,
    MarkerPopup,
    MapGeoJSON,
    type MapRef,
} from "@/components/ui/map";
import { MapHeatmapLayer } from "@/components/mapHeatplayer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TriangleAlert, ArrowLeft } from "lucide-react";
import type {
    SubDistrictResponse,
    GeographicStatItem,
    Incident,
    GeographicStatsResult,
} from "@/modules/incidents/incidents.type";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import centerOfMass from "@turf/center-of-mass";

const PRIORITY_STYLES: Record<string, { bg: string; pulse: string }> = {
    low: { bg: "bg-blue-400", pulse: "bg-blue-300/20" },
    medium: { bg: "bg-yellow-500", pulse: "bg-yellow-400/20" },
    high: { bg: "bg-orange-500", pulse: "bg-orange-400/25" },
};

const PRIORITY_LABELS: Record<string, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
};

const STATUS_LABELS: Record<string, string> = {
    in_review: "En revisión",
    open: "Abierto",
    assigned: "Asignado",
    in_progress: "En progreso",
    resolved: "Resuelto",
    closed: "Cerrado",
    rejected: "Rechazado",
};

function getSubDistrictFillColor(stats: GeographicStatItem | undefined): string {
    if (!stats || stats.total === 0) return "#22c55e";
    if (stats.high > 0) return "#ef4444";
    if (stats.total > 5) return "#f97316";
    return "#eab308";
}

function computeBbox(polygon: SubDistrictResponse["polygon"]): [number, number, number, number] {
    const coords: number[][] = [];

    function flatten(arr: number[] | number[][] | number[][][] | number[][][][]) {
        if (typeof arr[0] === "number") {
            coords.push(arr as number[]);
        } else {
            (arr as number[][]).forEach(flatten);
        }
    }

    polygon.coordinates.forEach(flatten);

    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);

    return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

function IncidentMarkerIcon({ priority }: { priority: string }) {
    const styles = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium;
    return (
        <div className="relative flex items-center justify-center">
            {priority === "high" && (
                <div className={`absolute size-8 rounded-full animate-ping ${styles.pulse}`} />
            )}
            <div className="relative flex flex-col items-center">
                <div className={`relative z-10 flex size-7 items-center justify-center rounded-full border border-white shadow-md ${styles.bg}`}>
                    <TriangleAlert className="size-3.5 text-white" strokeWidth={2.5} />
                </div>
                <div className={`-mt-1 size-2 rotate-45 border-r border-b border-white shadow-sm ${styles.bg}`} />
            </div>
        </div>
    );
}

interface MapsSectionProps {
    incidents: Incident[];
    onViewIncidentDetail: (id: string) => void;
}

export function MapsSection({ incidents, onViewIncidentDetail }: MapsSectionProps) {
    const { user } = useAuthUser();

    const [subDistricts, setSubDistricts] = useState<SubDistrictResponse[]>([]);
    const [geographicStats, setGeographicStats] = useState<GeographicStatItem[]>([]);
    const [isLoadingSubDistricts, setIsLoadingSubDistricts] = useState(true);

    const [selectedSubDistrict, setSelectedSubDistrict] = useState<SubDistrictResponse | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
    const [hoveredSubDistrictId, setHoveredSubDistrictId] = useState<string | null>(null);
    const [hoveredHeatmapPoint, setHoveredHeatmapPoint] = useState<{
        id: string; title: string; priority: string; status: string;
    } | null>(null);
    const [heatmapTooltipPos, setHeatmapTooltipPos] = useState<{ x: number; y: number } | null>(null);

    const choroplethMapRef = useRef<MapRef>(null);

    useEffect(() => {
        if (!user?.municipalityId) return;

        async function load() {
            try {
                const [subDistrictsData, geoStats, district] = await Promise.all([
                    subDistrictsService.getByMunicipalityId(user!.municipalityId!),
                    incidentsService.getGeographicStats(),
                    districtsService.getMyDistrict(),
                ]);
                setSubDistricts(subDistrictsData);
                setGeographicStats((geoStats as GeographicStatsResult).withSubDistrict);

                if (subDistrictsData.length > 0) {
                    const centroid = centerOfMass({
                        type: "FeatureCollection",
                        features: subDistrictsData.map(sd => ({
                            type: "Feature",
                            properties: {},
                            geometry: sd.polygon as GeoJSON.Polygon | GeoJSON.MultiPolygon,
                        })),
                    });
                    const [centerLng, centerLat] = centroid.geometry.coordinates as [number, number];
                    setMapCenter([centerLng, centerLat]);
                } else if (district?.polygon) {
                    // Fallback si todavía no hay barrios cargados
                    const centroid = centerOfMass({
                        type: "Feature",
                        properties: {},
                        geometry: district.polygon as GeoJSON.Polygon | GeoJSON.MultiPolygon,
                    });
                    const [centerLng, centerLat] = centroid.geometry.coordinates as [number, number];
                    setMapCenter([centerLng, centerLat]);
                }
            } catch (err) {
                console.error("Error loading map data:", err);
            } finally {
                setIsLoadingSubDistricts(false);
            }
        }

        load();
    }, [user?.municipalityId]);
    const activeMapIncidents = useMemo(() =>
        incidents.filter(i =>
            i.location?.type === "Point" &&
            Array.isArray(i.location.coordinates) &&
            i.location.coordinates.length === 2
        ), [incidents]);

    const heatmapPoints = useMemo(() =>
        incidents
            .filter(i =>
                i.location?.type === "Point" &&
                Array.isArray(i.location.coordinates) &&
                i.location.coordinates.length === 2 &&
                i.status !== "in_progress"
            )
            .map(i => ({
                coordinates: i.location!.coordinates as [number, number],
                priority: i.priority,
                id: i.id,
                title: i.title,
                status: i.status,
            })),
        [incidents]);

    const selectedSubDistrictIncidents = useMemo(() => {
        if (!selectedSubDistrict) return [];

        return incidents.filter(i => {
            if (
                i.location?.type !== "Point" ||
                !Array.isArray(i.location.coordinates) ||
                i.location.coordinates.length !== 2
            ) return false;

            const pt = point(i.location.coordinates);
            return booleanPointInPolygon(pt, selectedSubDistrict.polygon as GeoJSON.Polygon | GeoJSON.MultiPolygon);
        });
    }, [selectedSubDistrict, incidents]);

    const choroplethGeoJSON = useMemo((): GeoJSON.FeatureCollection => ({
        type: "FeatureCollection",
        features: subDistricts.map(sd => {
            const stats = geographicStats.find(s => s.subDistrictId === sd.id);
            return {
                type: "Feature",
                id: sd.id,
                geometry: sd.polygon as GeoJSON.Geometry,
                properties: {
                    id: sd.id,
                    name: sd.name,
                    total: stats?.total ?? 0,
                    open: stats?.open ?? 0,
                    high: stats?.high ?? 0,
                    fillColor: getSubDistrictFillColor(stats),
                },
            };
        }),
    }), [subDistricts, geographicStats]);

    const handleSubDistrictClick = useCallback((properties: GeoJSON.GeoJsonProperties) => {
        if (!properties?.id) return;

        const sd = subDistricts.find(s => s.id === properties.id);
        if (!sd) return;

        setSelectedSubDistrict(sd);

        const bbox = computeBbox(sd.polygon);
        choroplethMapRef.current?.fitBounds(
            [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
            { padding: 40, duration: 800 }
        );
    }, [subDistricts]);

    const handleBack = useCallback(() => {
        setSelectedSubDistrict(null);
        if (!mapCenter) return;
        choroplethMapRef.current?.flyTo({
            center: mapCenter,
            zoom: 12,
            duration: 800,
        });
    }, [mapCenter]);

    const handleHeatmapHover = useCallback((
        point: { id: string; title: string; priority: string; status: string; coordinates: [number, number] } | null,
        pos?: { x: number; y: number }
    ) => {
        setHoveredHeatmapPoint(point);
        setHeatmapTooltipPos(pos ?? null);
    }, []);
    const hoveredStats = hoveredSubDistrictId
        ? geographicStats.find(s => s.subDistrictId === hoveredSubDistrictId)
        : null;
    const hoveredSd = hoveredSubDistrictId
        ? subDistricts.find(s => s.id === hoveredSubDistrictId)
        : null;

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold tracking-tight">Mapas</h2>
                <p className="text-sm text-muted-foreground">Visualización geográfica de incidentes</p>
            </div>

            {/* Mapa 1: marcadores */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle>Incidentes activos</CardTitle>
                    <CardDescription>Todos los incidentes con ubicación registrada.</CardDescription>                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[460px] rounded-b-lg overflow-hidden">
                        {!mapCenter ? (
                            <div className="flex h-full items-center justify-center bg-muted/30">
                                <p className="text-sm text-muted-foreground">No se pudo obtener la ubicación del municipio.</p>
                            </div>
                        ) : activeMapIncidents.length === 0 ? (
                            <div className="flex h-full items-center justify-center bg-muted/30">
                                <p className="text-sm text-muted-foreground">Sin incidentes para mostrar.</p>
                            </div>
                        ) : (
                            <Map center={mapCenter} zoom={13}>
                                <MapControls showRecenter recenterCenter={mapCenter ?? undefined} recenterZoom={13} />
                                {activeMapIncidents.map(incident => {
                                    const [lng, lat] = incident.location!.coordinates;
                                    return (
                                        <MapMarker key={incident.id} longitude={lng} latitude={lat}>
                                            <MarkerContent>
                                                <IncidentMarkerIcon priority={incident.priority} />
                                            </MarkerContent>
                                            <MarkerTooltip>{incident.title}</MarkerTooltip>
                                            <MarkerPopup>
                                                <div className="max-w-[220px] space-y-3">
                                                    <p className="text-sm font-semibold break-words">{incident.title}</p>
                                                    <div className="space-y-1 text-xs text-muted-foreground">
                                                        <p>Prioridad: <span className="font-medium text-foreground">{PRIORITY_LABELS[incident.priority] ?? incident.priority}</span></p>
                                                        <p>Estado: <span className="font-medium text-foreground">{STATUS_LABELS[incident.status] ?? incident.status}</span></p>
                                                    </div>
                                                    <Button type="button" size="sm" className="w-full" onClick={() => onViewIncidentDetail(incident.id)}>
                                                        Ver detalle
                                                    </Button>
                                                </div>
                                            </MarkerPopup>
                                        </MapMarker>
                                    );
                                })}
                            </Map>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Mapa 2: heatmap */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle>Mapa de calor</CardTitle>
                    <CardDescription>Concentración de incidentes por zona (excluye en progreso).</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[460px] rounded-b-lg relative">
                        {!mapCenter ? (
                            <div className="flex h-full items-center justify-center bg-muted/30">
                                <p className="text-sm text-muted-foreground">No se pudo obtener la ubicación del municipio.</p>
                            </div>
                        ) : heatmapPoints.length === 0 ? (
                            <div className="flex h-full items-center justify-center bg-muted/30">
                                <p className="text-sm text-muted-foreground">Sin datos para mostrar.</p>
                            </div>
                        ) : (
                            <div className="absolute inset-0 rounded-b-lg overflow-hidden">
                                <Map center={mapCenter} zoom={12}>
                                    <MapControls showRecenter recenterCenter={mapCenter ?? undefined} recenterZoom={12} />
                                    <MapHeatmapLayer
                                        points={heatmapPoints}
                                        onPointHover={handleHeatmapHover}
                                    />
                                </Map>
                            </div>
                        )}
                        {hoveredHeatmapPoint && heatmapTooltipPos && (
                            <div
                                className="absolute z-10 bg-background/90 backdrop-blur-sm border rounded-lg p-3 shadow-md text-sm min-w-[160px] pointer-events-none"
                                style={{ left: heatmapTooltipPos.x + 12, top: heatmapTooltipPos.y - 10 }}
                            >
                                <p className="font-semibold truncate">{hoveredHeatmapPoint.title}</p>
                                <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                                    <p>Prioridad: <span className="font-medium text-foreground">{PRIORITY_LABELS[hoveredHeatmapPoint.priority] ?? hoveredHeatmapPoint.priority}</span></p>
                                    <p>Estado: <span className="font-medium text-foreground">{STATUS_LABELS[hoveredHeatmapPoint.status] ?? hoveredHeatmapPoint.status}</span></p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Mapa 3: barrios con zoom e incidentes */}
            {(isLoadingSubDistricts || subDistricts.length > 0) && (
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Incidentes por barrio</CardTitle>
                                <CardDescription className="mt-0.5">
                                    {selectedSubDistrict
                                        ? `Mostrando incidentes en ${selectedSubDistrict.name}`
                                        : "Hacé click en un barrio para ver sus incidentes."}
                                </CardDescription>
                            </div>
                            {selectedSubDistrict && (
                                <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1.5">
                                    <ArrowLeft className="size-4" />
                                    Volver
                                </Button>
                            )}
                        </div>

                        {!selectedSubDistrict && (
                            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-green-500 inline-block" /> Sin incidentes</span>
                                <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-yellow-500 inline-block" /> 1–5</span>
                                <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-orange-500 inline-block" /> +5</span>
                                <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-red-500 inline-block" /> Alta prioridad</span>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="h-[460px] rounded-b-lg overflow-hidden relative">
                            {isLoadingSubDistricts ? (
                                <div className="flex h-full items-center justify-center bg-muted/30">
                                    <p className="text-sm text-muted-foreground">Cargando barrios...</p>
                                </div>
                            ) : !mapCenter ? (
                                <div className="flex h-full items-center justify-center bg-muted/30">
                                    <p className="text-sm text-muted-foreground">No se pudo obtener la ubicación del municipio.</p>
                                </div>
                            ) : subDistricts.length === 0 ? (
                                <div className="flex h-full items-center justify-center bg-muted/30">
                                    <p className="text-sm text-muted-foreground">Sin barrios cargados para este municipio.</p>
                                </div>
                            ) : (
                                <Map ref={choroplethMapRef} center={mapCenter} zoom={12}>
                                    <MapControls showRecenter recenterCenter={mapCenter ?? undefined} recenterZoom={12} />

                                    <MapGeoJSON
                                        data={choroplethGeoJSON}
                                        fillPaint={{
                                            "fill-color": ["get", "fillColor"],
                                            "fill-opacity": [
                                                "case",
                                                ["==", ["get", "id"], hoveredSubDistrictId ?? ""],
                                                0.55,
                                                0.3,
                                            ],
                                        }}
                                        linePaint={{
                                            "line-color": "#ffffff",
                                            "line-width": 1.5,
                                            "line-opacity": 0.7,
                                        }}
                                        onFeatureClick={handleSubDistrictClick}
                                        onFeatureHover={props =>
                                            setHoveredSubDistrictId(
                                                props?.id ? String(props.id) : null)
                                        }
                                    />

                                    {selectedSubDistrict &&
                                        selectedSubDistrictIncidents.map(incident => {
                                            const [lng, lat] = incident.location!.coordinates;
                                            return (
                                                <MapMarker key={incident.id} longitude={lng} latitude={lat}>
                                                    <MarkerContent>
                                                        <IncidentMarkerIcon priority={incident.priority} />
                                                    </MarkerContent>
                                                    <MarkerTooltip>{incident.title}</MarkerTooltip>
                                                    <MarkerPopup>
                                                        <div className="max-w-[220px] space-y-3">
                                                            <p className="text-sm font-semibold break-words">{incident.title}</p>
                                                            <div className="space-y-1 text-xs text-muted-foreground">
                                                                <p>Prioridad: <span className="font-medium text-foreground">{PRIORITY_LABELS[incident.priority] ?? incident.priority}</span></p>
                                                                <p>Estado: <span className="font-medium text-foreground">{STATUS_LABELS[incident.status] ?? incident.status}</span></p>
                                                            </div>
                                                            <Button type="button" size="sm" className="w-full" onClick={() => onViewIncidentDetail(incident.id)}>
                                                                Ver detalle
                                                            </Button>
                                                        </div>
                                                    </MarkerPopup>
                                                </MapMarker>
                                            );
                                        })
                                    }
                                </Map>
                            )}

                            {!selectedSubDistrict && hoveredSd && (
                                <div className="absolute top-3 left-3 z-10 bg-background/90 backdrop-blur-sm border rounded-lg p-3 shadow-md text-sm min-w-[160px] pointer-events-none">
                                    <p className="font-semibold">{hoveredSd.name}</p>
                                    <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                                        <p>Total: <span className="font-medium text-foreground">{hoveredStats?.total ?? 0}</span></p>
                                        <p>Abiertos: <span className="font-medium text-foreground">{hoveredStats?.open ?? 0}</span></p>
                                        <p>Alta prioridad: <span className="font-medium text-red-500">{hoveredStats?.high ?? 0}</span></p>
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground italic">Click para ver incidentes</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}