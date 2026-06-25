import { useEffect, useState } from "react";
import { incidentsService } from "@/modules/incidents/incidents.service";
import { IncidentDetailCard } from "@/components/IncidentDetailCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MapsSection } from "@/components/MapsSection";
import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";
import { useAuthUser } from "@/modules/auth/auth.context";

import type { Incident, AdminIncidentDetail } from "@/modules/incidents/incidents.type";
import type {
    ResolutionMetricsResult,
} from "@/modules/incidents/incidents.type";

import {
    Card,
    CardContent,
} from "@/components/ui/card";

import {
    CheckCircle2,
    Clock4,
    Flame,
    TrendingUp,
} from "lucide-react";

// ─── Constantes ───────────────────────────────────────────────────────────────
let dashboardCache: {
    incidents: Incident[];
    resolution: ResolutionMetricsResult | null;
} | null = null;

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

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
    // Datos
    const [incidents, setIncidents] = useState<Incident[]>(dashboardCache?.incidents ?? []);
    const [resolution, setResolution] = useState<ResolutionMetricsResult | null>(dashboardCache?.resolution ?? null);
    const [isLoading, setIsLoading] = useState(!dashboardCache);
    const { user } = useAuthUser();

    // UI
    const [selectedIncident, setSelectedIncident] = useState<AdminIncidentDetail | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    useEffect(() => {
        async function loadAll() {
            try {
                if (!dashboardCache) setIsLoading(true);

                const [incidentsData, resData] = await Promise.all([
                    incidentsService.getIncidents(),
                    api
                        .get<ResolutionMetricsResult>(API_ROUTES.incident_stats.resolution)
                        .then((r) => r.data),
                ]);

                setIncidents(incidentsData);
                setResolution(resData);

                dashboardCache = { incidents: incidentsData, resolution: resData };
            } catch (err) {
                console.error("Error al cargar dashboard:", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadAll();
    }, []);

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

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="flex flex-col items-center gap-3">
                    <div className="size-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
                    <p className="text-sm font-medium text-foreground">Cargando dashboard...</p>
                    <p className="text-xs text-muted-foreground">Estamos preparando el resumen de tu municipio</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Bienvenido, {user?.name?.split(" ")[0] ?? "admin"}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Resumen general de tu municipalidad
                </p>
            </div>

            {/* ── Metric cards ── */}
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
                    value={overall?.avgResolutionHours != null ? `${overall.avgResolutionHours}h` : "—"}
                    subtitle="Promedio de resolución"
                    icon={<Clock4 className="size-5" />}
                    iconColor="text-orange-500"
                />
            </div>

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