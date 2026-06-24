import { useEffect, useState, useMemo } from "react";
import { useAuthUser } from "@/modules/auth/auth.context";
import { incidentsService } from "@/modules/incidents/incidents.service";
import { IncidentDetailCard } from "@/components/IncidentDetailCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MapsSection } from "@/components/MapsSection";
import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";

import type { Incident, AdminIncidentDetail } from "@/modules/incidents/incidents.type";
import type {
    FrequencyByCategoryResult,
    ResolutionMetricsResult,
} from "@/modules/incidents/incidents.type";

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
} from "lucide-react";

// ─── Constantes ───────────────────────────────────────────────────────────────
let dashboardCache: {
    incidents: Incident[];
    frequency: FrequencyByCategoryResult[];
    resolution: ResolutionMetricsResult | null;
} | null = null;

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
    const [incidents, setIncidents] = useState<Incident[]>(dashboardCache?.incidents ?? []);
    const [frequency, setFrequency] = useState<FrequencyByCategoryResult[]>(dashboardCache?.frequency ?? []);
    const [resolution, setResolution] = useState<ResolutionMetricsResult | null>(dashboardCache?.resolution ?? null);
    const [isLoading, setIsLoading] = useState(!dashboardCache);

    // UI
    const [selectedIncident, setSelectedIncident] = useState<AdminIncidentDetail | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    useEffect(() => {
        async function loadAll() {
            try {
                if (!dashboardCache) setIsLoading(true);

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

                dashboardCache = { incidents: incidentsData, frequency: freqData, resolution: resData };
            } catch (err) {
                console.error("Error al cargar dashboard:", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadAll();
    }, []);

    const barData = useMemo(
        () =>
            frequency
                .slice(0, 6)
                .map((f) => ({
                    name: f.categoryName || f.categoryLabel || f.categoryId || "Sin categoría",
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

    async function openIncidentDetail(id: string) {
        setIsDetailDialogOpen(true);
        setIsLoadingDetail(true);
        try {
            const data = await incidentsService.getIncidentById(id);
            setSelectedIncident(data);
        } catch (err) {
            console.error("Error al cargar incidente:", err);
        } finally {
            setIsLoadingDetail(false);
        }
    }

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

            {/* ── Mapas uno debajo del otro ── */}
            <div className="space-y-4">
                <MapsSection
                    incidents={incidents}
                    onViewIncidentDetail={(id) => openIncidentDetail(id)}
                />
            </div>

            <Dialog
                open={isDetailDialogOpen}
                onOpenChange={(open) => {
                    setIsDetailDialogOpen(open);
                    if (!open) setSelectedIncident(null);
                }}
            >
                <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                    {isLoadingDetail || !selectedIncident ? (
                        <div className="h-40 flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">Cargando...</p>
                        </div>
                    ) : (
                        <IncidentDetailCard
                            incident={selectedIncident}
                            showMap
                            showResolutionPhoto
                            showAssignmentData
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}