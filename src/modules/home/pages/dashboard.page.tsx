import { useEffect, useState, useMemo } from "react";
import { useAuthUser } from "@/modules/auth/auth.context";
import { incidentsService } from "@/modules/incidents/incidents.service";
import { IncidentDetailDialog } from "@/components/dialog-incident";

import type { Incident } from "@/modules/incidents/incidents.type";

import {
    Map,
    MapControls,
    MapMarker,
    MarkerContent,
    MarkerTooltip,
    MarkerPopup,
} from "@/components/ui/map";
import { MapHeatmapLayer } from "@/components/mapHeatplayer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Flame,
    ListChecks,
    TriangleAlert,
} from "lucide-react";

type MapCenter = [number, number];

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

interface StatCardProps {
    title: string;
    value: number | string;
    description?: string;
    icon: React.ReactNode;
    color?: string;
}

function StatCard({ title, value, description, icon, color = "text-foreground" }: StatCardProps) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            {title}
                        </p>

                        <p className={`text-2xl font-semibold leading-none ${color}`}>
                            {value}
                        </p>

                        {description && (
                            <p className="text-xs text-muted-foreground leading-tight">
                                {description}
                            </p>
                        )}
                    </div>

                    <div className={`${color} opacity-80`}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminDashboardPage() {
    const { user } = useAuthUser();
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

    useEffect(() => {
        async function loadIncidents() {
            try {
                setIsLoading(true);
                const data = await incidentsService.getIncidents();
                setIncidents(data);
            } catch (err) {
                console.error("Error al cargar incidentes:", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadIncidents();
    }, []);

    const stats = useMemo(() => {
        const total = incidents.length;
        const resolved = incidents.filter(i => i.status === "resolved" || i.status === "closed").length;
        const critical = incidents.filter(i => i.priority === "high").length;
        const inReview = incidents.filter(i => i.status === "in_review").length;
        const assigned = incidents.filter(i => i.status === "assigned").length;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const lastMonth = incidents.filter(i => new Date(i.createdAt) >= thirtyDaysAgo).length;

        return { total, resolved, critical, inReview, assigned, lastMonth };
    }, [incidents]);

    const validMapIncidents = useMemo(() =>
        incidents.filter(i =>
            i.location?.type === "Point" &&
            Array.isArray(i.location.coordinates) &&
            i.location.coordinates.length === 2
        ), [incidents]);

    const mapCenter = useMemo<MapCenter | null>(() => {
        if (validMapIncidents.length === 0) return null;
        return validMapIncidents[0].location!.coordinates as MapCenter;
    }, [validMapIncidents]);

    const heatmapPoints = useMemo(() =>
        validMapIncidents.map(i => ({
            coordinates: i.location!.coordinates as [number, number],
            priority: i.priority,
        })), [validMapIncidents]);

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">

            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Bienvenido, {user?.name?.split(" ")[0] ?? "admin"}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Resumen general de tu municipalidad
                </p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-5">
                                <div className="h-16 animate-pulse bg-muted rounded-md" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard
                        title="TOTAL"
                        value={stats.total}
                        icon={<ListChecks className="size-6" />}
                    />
                    <StatCard
                        title="Resueltos"
                        value={stats.resolved}
                        icon={<CheckCircle2 className="size-6" />}
                        color="text-green-500"
                    />
                    <StatCard
                        title="Alta prioridad"
                        value={stats.critical}
                        icon={<Flame className="size-6" />}
                        color="text-red-500"
                    />
                    <StatCard
                        title="En revisión"
                        value={stats.inReview}
                        icon={<Clock className="size-6" />}
                        color="text-yellow-500"
                    />
                    <StatCard
                        title="Asignados"
                        value={stats.assigned}
                        icon={<AlertTriangle className="size-6" />}
                        color="text-blue-500"
                    />
                    <StatCard
                        title="Último mes"
                        value={stats.lastMonth}
                        icon={<ListChecks className="size-6" />}
                        color="text-purple-500"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle>Incidentes en el mapa</CardTitle>
                            <CardDescription>Distribución geográfica de incidentes activos.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="h-[320px] rounded-b-lg overflow-hidden">
                            {isLoading || !mapCenter ? (
                                <div className="flex h-full items-center justify-center bg-muted/30">
                                    <p className="text-sm text-muted-foreground">
                                        {isLoading ? "Cargando mapa..." : "Sin incidentes para mostrar."}
                                    </p>
                                </div>
                            ) : (
                                <Map center={mapCenter} zoom={13}>
                                    <MapControls />
                                    {validMapIncidents.map((incident) => {
                                        const [lng, lat] = incident.location!.coordinates;
                                        return (
                                            <MapMarker key={incident.id} longitude={lng} latitude={lat}>
                                                <MarkerContent>
                                                    <IncidentMarkerIcon priority={incident.priority} />
                                                </MarkerContent>
                                                <MarkerTooltip>{incident.title}</MarkerTooltip>
                                                <MarkerPopup>
                                                    <div className="max-w-[220px] box-border space-y-3 overflow-hidden">
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-semibold text-foreground break-words">{incident.title}</p>
                                                        </div>
                                                        <div className="space-y-1 text-xs text-muted-foreground">
                                                            <p>Prioridad: <span className="font-medium text-foreground">{PRIORITY_LABELS[incident.priority] ?? incident.priority}</span></p>
                                                            <p>Estado: <span className="font-medium text-foreground">{STATUS_LABELS[incident.status] ?? incident.status}</span></p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            className="w-full max-w-full box-border"
                                                            onClick={() => {
                                                                setSelectedIncidentId(incident.id);
                                                                setIsDetailDialogOpen(true);
                                                            }}
                                                        >
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

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Mapa de calor</CardTitle>
                        <CardDescription>Zonas con mayor concentración de incidentes.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="h-[320px] rounded-b-lg overflow-hidden">
                            {isLoading || !mapCenter || heatmapPoints.length === 0 ? (
                                <div className="flex h-full items-center justify-center bg-muted/30">
                                    <p className="text-sm text-muted-foreground">
                                        {isLoading ? "Cargando datos..." : "Sin datos para mostrar."}
                                    </p>
                                </div>
                            ) : (
                                <Map center={mapCenter} zoom={12}>
                                    <MapControls />
                                    <MapHeatmapLayer points={heatmapPoints} />
                                </Map>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </div>
            <IncidentDetailDialog
                incidentId={selectedIncidentId}
                open={isDetailDialogOpen}
                onOpenChange={setIsDetailDialogOpen}
            />
        </div>
    );
}