import { useEffect, useState, useMemo } from "react";
import { useAuthUser } from "@/modules/auth/auth.context";
import { incidentsService } from "@/modules/incidents/incidents.service";
import { IncidentDetailDialog } from "@/components/dialog-incident";
import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";

import type { Incident } from "@/modules/incidents/incidents.type";
import type {
    FrequencyByCategoryResult,
    ResolutionMetricsResult,
} from "@/modules/incidents/incidents.type";

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
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Legend,
    LabelList,
} from "recharts";
import {
    CheckCircle2,
    Clock4,
    Flame,
    TrendingUp,
    TriangleAlert,
} from "lucide-react";

// ─── Constantes ───────────────────────────────────────────────────────────────

type MapCenter = [number, number];

const PRIORITY_STYLES: Record<string, { bg: string; pulse: string }> = {
    low: { bg: "bg-blue-400", pulse: "bg-blue-300/20" },
    medium: { bg: "bg-yellow-500", pulse: "bg-yellow-400/20" },
    high: { bg: "bg-orange-500", pulse: "bg-orange-400/25" },
    none: { bg: "bg-gray-400", pulse: "bg-gray-300/20" },

};

const PRIORITY_LABELS: Record<string, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
    none: "Sin prioridad",
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

// Colores para el pie chart de estados
const STATUS_COLORS: Record<string, string> = {
    open: "#3b82f6",   // azul
    in_review: "#f59e0b",   // ámbar
    assigned: "#a855f7",   // violeta
    in_progress: "#f97316",   // naranja
    resolved: "#22c55e",   // verde
    closed: "#94a3b8",   // gris azulado (más claro que antes)
    rejected: "#ef4444",   // rojo
};

const BAR_COLORS = {
    Abierto: "#3b82f6",
    Asignado: "#a855f7",
    Resuelto: "#22c55e",
    Cerrado: "#94a3b8",   // más claro que #6b7280
};


// ─── Subcomponentes ───────────────────────────────────────────────────────────

function IncidentMarkerIcon({ priority }: { priority: string }) {
    const styles = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium;
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

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ReactNode;
    iconColor: string;
}

function MetricCard({ title, value, subtitle, icon, iconColor }: MetricCardProps) {
    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {title}
                        </p>
                        <p className="text-3xl font-bold tracking-tight">{value}</p>
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    </div>
                    <div className={`p-2 rounded-lg bg-muted/50 ${iconColor}`}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Tooltip custom para el bar chart
function CustomBarTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-popover border rounded-lg shadow-lg p-3 text-xs space-y-1.5">
            <p className="font-semibold text-foreground mb-2">{label}</p>
            {payload.map((entry: any) => (
                <div key={entry.dataKey} className="flex items-center gap-2">
                    <span
                        className="inline-block size-2 rounded-full"
                        style={{ backgroundColor: entry.fill }}
                    />
                    <span className="text-muted-foreground">{entry.name}:</span>
                    <span className="font-medium text-foreground">{entry.value}</span>
                </div>
            ))}
        </div>
    );
}

// Tooltip custom para el pie chart
function CustomPieTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const { name, value, payload: p } = payload[0];
    const pct = p.percent ? `${(p.percent * 100).toFixed(1)}%` : "";
    return (
        <div className="bg-popover border rounded-lg shadow-lg p-3 text-xs">
            <p className="font-semibold text-foreground">{name}</p>
            <p className="text-muted-foreground">
                {value} incidentes · {pct}
            </p>
        </div>
    );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
    const { user } = useAuthUser();

    // Datos
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [frequency, setFrequency] = useState<FrequencyByCategoryResult[]>([]);
    const [resolution, setResolution] = useState<ResolutionMetricsResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // UI
    const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

    useEffect(() => {
        async function loadAll() {
            try {
                setIsLoading(true);
                const [incidentsData, freqData, resData] = await Promise.all([
                    incidentsService.getIncidents(),
                    api
                        .get<FrequencyByCategoryResult[]>(API_ROUTES.incident_stats.frequency)
                        .then((r) => r.data),
                    api
                        .get<ResolutionMetricsResult>(API_ROUTES.incident_stats.resolution)
                        .then((r) => r.data),
                ]);
                setIncidents(incidentsData);
                setFrequency(freqData);
                setResolution(resData);
            } catch (err) {
                console.error("Error al cargar dashboard:", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadAll();
    }, []);

    // ── Mapa: todos los incidentes con coordenadas válidas
    const validMapIncidents = useMemo(
        () =>
            incidents.filter(
                (i) =>
                    i.location?.type === "Point" &&
                    Array.isArray(i.location.coordinates) &&
                    i.location.coordinates.length === 2,
            ),
        [incidents],
    );

    const mapCenter = useMemo<MapCenter | null>(() => {
        if (validMapIncidents.length === 0) return null;
        return validMapIncidents[0].location!.coordinates as MapCenter;
    }, [validMapIncidents]);

    // ── Heatmap: todos excepto in_progress
    const heatmapPoints = useMemo(
        () =>
            incidents
                .filter(
                    (i) =>
                        i.status !== "in_progress" &&
                        i.location?.type === "Point" &&
                        Array.isArray(i.location.coordinates) &&
                        i.location.coordinates.length === 2,
                )
                .map((i) => ({
                    coordinates: i.location!.coordinates as [number, number],
                    priority: i.priority,
                })),
        [incidents],
    );

    const barData = useMemo(
        () =>
            frequency
                .slice(0, 6)
                .map((f) => ({
                    name: (f.categoryName ?? "Sin categoría").replace(/\s+/g, "\n"),
                    Abierto: f.open ?? 0,
                    Asignado: f.assigned ?? 0,
                    Resuelto: f.resolved ?? 0,
                    Cerrado: f.closed ?? 0,
                }))

                .sort((a, b) =>
                    (b.Abierto + b.Asignado + b.Resuelto + b.Cerrado) -
                    (a.Abierto + a.Asignado + a.Resuelto + a.Cerrado)
                ),
        [frequency],
    );

    // ── Datos para pie chart (distribución por estado)
    const pieData = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const inc of incidents) {
            counts[inc.status] = (counts[inc.status] ?? 0) + 1;
        }
        return Object.entries(counts)
            .map(([status, value]) => ({
                name: STATUS_LABELS[status] ?? status,
                value,
                status,
                fill: STATUS_COLORS[status] ?? "#94a3b8",  // ← acá
            }))
            .sort((a, b) => b.value - a.value);
    }, [incidents]);

    // ── Métricas principales (vienen del endpoint /stats/resolution)
    const overall = resolution?.overall;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Bienvenido, {user?.name?.split(" ")[0] ?? "admin"}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Resumen general de tu municipalidad
                </p>
            </div>

            {/* ── Metric cards ── */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-5">
                                <div className="h-20 animate-pulse bg-muted rounded-md" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                        title="Total incidentes"
                        value={overall?.totalIncidents ?? 0}
                        subtitle="Registrados en tu municipio"
                        icon={<TrendingUp className="size-5" />}
                        iconColor="text-blue-500"
                    />
                    <MetricCard
                        title="Tasa de cierre"
                        value={`${overall?.closureRate ?? 0}%`}
                        subtitle={`${overall?.closedIncidents ?? 0} cerrados de ${overall?.totalIncidents ?? 0}`}
                        icon={<CheckCircle2 className="size-5" />}
                        iconColor="text-green-500"
                    />
                    <MetricCard
                        title="Alta prioridad"
                        value={overall?.criticalIncidents ?? 0}
                        subtitle="Incidentes críticos activos"
                        icon={<Flame className="size-5" />}
                        iconColor="text-red-500"
                    />
                    <MetricCard
                        title="Tiempo promedio"
                        value={
                            overall?.avgResolutionHours != null
                                ? `${overall.avgResolutionHours}h`
                                : "—"
                        }
                        subtitle="Promedio de resolución"
                        icon={<Clock4 className="size-5" />}
                        iconColor="text-orange-500"
                    />
                </div>
            )}

            {/* ── Gráficos ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                {/* Barras HORIZONTALES — 3 columnas */}
                <Card className="lg:col-span-3">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Incidentes por categoría</CardTitle>
                        <CardDescription>
                            Distribución de estados en las categorías más activas
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading || barData.length === 0 ? (
                            <div className="h-[260px] flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">
                                    {isLoading ? "Cargando..." : "Sin datos de categorías."}
                                </p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart
                                    data={barData}
                                    layout="vertical"                          // ← horizontal
                                    margin={{ top: 4, right: 48, left: 8, bottom: 0 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="hsl(var(--border))"
                                        horizontal={false}                     // solo líneas verticales
                                    />
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={100}
                                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomBarTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                                    <Bar dataKey="Abierto" stackId="a" fill={BAR_COLORS.Abierto} />
                                    <Bar dataKey="Asignado" stackId="a" fill={BAR_COLORS.Asignado} />
                                    <Bar dataKey="Resuelto" stackId="a" fill={BAR_COLORS.Resuelto} />
                                    <Bar dataKey="Cerrado" stackId="a" fill={BAR_COLORS.Cerrado} radius={[0, 4, 4, 0]}> 
                                            <LabelList
                                                dataKey="Cerrado"
                                                position="right"
                                                content={(props) => {
                                                    const { x, y, width, height, index } = props as {
                                                        x: number; y: number; width: number; height: number; index: number;
                                                    };
                                                    const row = barData[index];
                                                    if (!row) return null;
                                                    const total = row.Abierto + row.Asignado + row.Resuelto + row.Cerrado;
                                                    if (total === 0) return null;
                                                    return (
                                                        <text
                                                            x={(x as number) + (width as number) + 6}
                                                            y={(y as number) + (height as number) / 2}
                                                            dy="0.35em"
                                                            fontSize={11}
                                                            fill="hsl(var(--muted-foreground))"
                                                        >
                                                            {total}
                                                        </text>
                                                    );
                                                }}
                                            />
                                        </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Pie — 2 columnas */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Distribución por estado</CardTitle>
                        <CardDescription>Proporción actual de todos los incidentes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading || pieData.length === 0 ? (
                            <div className="h-[260px] flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">
                                    {isLoading ? "Cargando..." : "Sin datos."}
                                </p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="42%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, value, percent }) => {
                                            if (percent == null || percent < 0.06) return null;
                                            if (midAngle == null) return null;
                                            const RADIAN = Math.PI / 180;
                                            const radius = (innerRadius as number) + ((outerRadius as number) - (innerRadius as number)) * 0.5;
                                            const x = (cx as number) + radius * Math.cos(-midAngle * RADIAN);
                                            const y = (cy as number) + radius * Math.sin(-midAngle * RADIAN);
                                            return (
                                                <text
                                                    x={x} y={y}
                                                    textAnchor="middle"
                                                    dominantBaseline="central"
                                                    fontSize={11}
                                                    fill="#fff"
                                                    fontWeight={600}
                                                >
                                                    {value}
                                                </text>
                                            );
                                        }}
                                        labelLine={false}
                                    />
                                    <Tooltip content={<CustomPieTooltip />} />
                                    <Legend
                                        iconType="circle"
                                        iconSize={8}
                                        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Mapas uno debajo del otro ── */}
            <div className="space-y-4">                                        {/* ← era grid 2 cols */}

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Mapa de incidentes</CardTitle>
                        <CardDescription>
                            Distribución geográfica de todos los incidentes
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="h-[400px] rounded-b-lg overflow-hidden">  {/* ← más alto ahora */}
                            {isLoading || !mapCenter ? (
                                <div className="flex h-full items-center justify-center bg-muted/30">
                                    <p className="text-sm text-muted-foreground">
                                        {isLoading ? "Cargando mapa..." : "Sin incidentes con ubicación."}
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
                                                    {/* Fallback a "none" si priority es undefined/null */}
                                                    <IncidentMarkerIcon
                                                        priority={incident.priority ?? "none"}
                                                    />
                                                </MarkerContent>
                                                <MarkerTooltip>{incident.title}</MarkerTooltip>
                                                <MarkerPopup>
                                                    <div className="max-w-[220px] box-border space-y-3 overflow-hidden">
                                                        <p className="text-sm font-semibold text-foreground break-words">
                                                            {incident.title}
                                                        </p>
                                                        <div className="space-y-1 text-xs text-muted-foreground">
                                                            <p>
                                                                Prioridad:{" "}
                                                                <span className="font-medium text-foreground">
                                                                    {PRIORITY_LABELS[incident.priority ?? "none"]}
                                                                </span>
                                                            </p>
                                                            <p>
                                                                Estado:{" "}
                                                                <span className="font-medium text-foreground">
                                                                    {STATUS_LABELS[incident.status] ?? incident.status}
                                                                </span>
                                                            </p>
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
                        <CardTitle className="text-base">Mapa de calor</CardTitle>
                        <CardDescription>
                            Zonas con mayor concentración de incidentes (excluye en progreso)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="h-[400px] rounded-b-lg overflow-hidden">
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