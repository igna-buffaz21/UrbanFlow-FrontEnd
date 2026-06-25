import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";
import type {
    FrequencyByCategoryResult,
    ResolutionMetricsResult,
    GeographicStatsResult,
    ExtendedStatsResult,
    TemporalGroupBy,
} from "@/modules/incidents/incidents.type";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
} from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { CheckCircle2, Clock4, Flame, MapPin, Users } from "lucide-react";

const urgentStatusChartConfig = {
    Abierto: { label: "Abierto", color: "#ef4444" },
    Asignado: { label: "Asignado", color: "#f97316" },
    Resuelto: { label: "Resuelto", color: "#fbbf24" },
    Cerrado: { label: "Cerrado", color: "#94a3b8" },
} satisfies ChartConfig

const urgentResolutionChartConfig = {
    TasaCierre: { label: "Tasa de cierre (%)", color: "#ef4444" },
    TiempoPromedio: { label: "Tiempo promedio (h)", color: "#f97316" },
} satisfies ChartConfig

const urgentTemporalChartConfig = {
    Total: { label: "Total Alta Prioridad", color: "#ef4444" },
    Cerrados: { label: "Cerrados", color: "#f97316" },
} satisfies ChartConfig

const urgentOperatorChartConfig = {
    Asignados: { label: "Asignados", color: "#ef4444" },
    Resueltos: { label: "Resueltos", color: "#f97316" },
    Cerrados: { label: "Cerrados", color: "#fbbf24" },
} satisfies ChartConfig

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function formatPeriod(period: string, groupBy: "day" | "week" | "month"): string {
    const parts = period.split("-");
    if (groupBy === "week") {
        const p = period.split("-W");
        return `Sem ${p[1]} ${p[0]}`;
    }
    if (groupBy === "day") return `${parseInt(parts[2])}/${parseInt(parts[1])}`;
    return `${MONTH_NAMES[parseInt(parts[1]) - 1]} ${parts[0]}`;
}

function MetricCard({ title, value, subtitle, icon, iconColor }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ReactNode;
    iconColor: string;
}) {
    return (
        <Card className="border-red-200 dark:border-red-900">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight">{title}</p>
                        <p className="text-3xl font-bold tracking-tight">{value}</p>
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    </div>
                    <div className={`p-2 rounded-lg bg-red-50 dark:bg-red-950 shrink-0 ${iconColor}`}>{icon}</div>
                </div>
            </CardContent>
        </Card>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="text-base font-semibold text-foreground border-b border-red-200 dark:border-red-900 pb-2">
            {children}
        </h2>
    );
}

const PRIORITY_FILTER = { params: { priority: "medium" } };

export function UrgentStatsPage() {
    const [frequency, setFrequency] = useState<FrequencyByCategoryResult[]>([]);
    const [resolution, setResolution] = useState<ResolutionMetricsResult | null>(null);
    const [geographic, setGeographic] = useState<GeographicStatsResult | null>(null);
    const [extended, setExtended] = useState<ExtendedStatsResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOperator, setSelectedOperator] = useState("__all__");
    const [groupBy, setGroupBy] = useState<TemporalGroupBy>("month");
    const [isLoadingExtended, setIsLoadingExtended] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [freqData, resData, geoData] = await Promise.all([
                    api.get<FrequencyByCategoryResult[]>(API_ROUTES.incident_stats.frequency, PRIORITY_FILTER).then(r => r.data),
                    api.get<ResolutionMetricsResult>(API_ROUTES.incident_stats.resolution, PRIORITY_FILTER).then(r => r.data),
                    api.get<GeographicStatsResult>(API_ROUTES.incident_stats.geographic, PRIORITY_FILTER).then(r => r.data),
                ]);
                setFrequency(freqData);
                setResolution(resData);
                setGeographic(geoData);
            } catch (err) {
                console.error("Error cargando estadísticas urgentes:", err);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    useEffect(() => {
        async function loadExtended() {
            setIsLoadingExtended(true);
            try {
                const extData = await api.get<ExtendedStatsResult>(
                    API_ROUTES.incident_stats.extended,
                    { params: { groupBy, priority: "medium" } }
                ).then(r => r.data);
                setExtended(extData);
            } catch (err) {
                console.error("Error cargando extended stats urgentes:", err);
            } finally {
                setIsLoadingExtended(false);
            }
        }
        loadExtended();
    }, [groupBy]);

    const overall = resolution?.overall;

    const frequencyBarData = useMemo(() =>
        frequency.map(f => ({
            name: f.categoryLabel ?? f.categoryName ?? "Sin categoría",
            Abierto: f.open ?? 0,
            Asignado: f.assigned ?? 0,
            Resuelto: f.resolved ?? 0,
            Cerrado: f.closed ?? 0,
            total: (f.open ?? 0) + (f.assigned ?? 0) + (f.resolved ?? 0) + (f.closed ?? 0),
        })).sort((a, b) => b.total - a.total),
        [frequency]
    );

    const resolutionBarData = useMemo(() =>
        (resolution?.byCategory ?? []).map(c => ({
            name: c.categoryLabel ?? c.categoryName ?? "Sin categoría",
            TasaCierre: parseFloat(c.closureRate.toFixed(1)),
            TiempoPromedio: c.avgResolutionHours !== null ? parseFloat(c.avgResolutionHours.toFixed(1)) : null,
        })).sort((a, b) => b.TasaCierre - a.TasaCierre),
        [resolution]
    );

    const temporalData = useMemo(() =>
        (extended?.temporal ?? []).map(t => ({
            period: formatPeriod(t.period, groupBy),
            Total: t.total,
            Cerrados: t.closed ?? 0,
        })),
        [extended, groupBy]
    );

    const operatorData = useMemo(() =>
        (extended?.byOperator ?? []).map(o => ({
            name: o.operatorName,
            Asignados: o.total,
            Resueltos: o.resolved,
            Cerrados: o.closed,
        })),
        [extended]
    );

    const filteredOperatorData = useMemo(() =>
        selectedOperator === "__all__"
            ? operatorData
            : operatorData.filter(op => op.name === selectedOperator),
        [operatorData, selectedOperator]
    );

    const geoBarData = useMemo(() =>
        (geographic?.withSubDistrict ?? []).map(g => ({
            name: g.subDistrictName,
            Abierto: g.open ?? 0,
            Asignado: g.assigned ?? 0,
            Resuelto: g.resolved ?? 0,
            Cerrado: g.closed ?? 0,
            total: g.total ?? 0,
        })).sort((a, b) => b.total - a.total),
        [geographic]
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="flex flex-col items-center gap-3">
                    <div className="size-10 border-4 border-muted border-t-red-500 rounded-full animate-spin" />
                    <p className="text-sm font-medium text-foreground">Cargando incidentes urgentes...</p>
                    <p className="text-xs text-muted-foreground">Procesando incidentes de alta prioridad</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950">
                    <Flame className="size-6 text-red-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Incidentes Urgentes</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Análisis exclusivo de incidentes de alta prioridad
                    </p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard
                    title="Alta prioridad activos"
                    value={overall?.criticalIncidents ?? 0}
                    subtitle="Total de alta prioridad"
                    icon={<Flame className="size-5" />}
                    iconColor="text-red-500"
                />
                <MetricCard
                    title="Tasa de cierre"
                    value={`${overall?.closureRate ?? 0}%`}
                    subtitle={`${overall?.closedIncidents ?? 0} cerrados de ${overall?.totalIncidents ?? 0}`}
                    icon={<CheckCircle2 className="size-5" />}
                    iconColor="text-red-500"
                />
                <MetricCard
                    title="Tiempo promedio"
                    value={overall?.avgResolutionHours != null ? `${overall.avgResolutionHours}h` : "—"}
                    subtitle="Promedio de resolución"
                    icon={<Clock4 className="size-5" />}
                    iconColor="text-red-500"
                />
            </div>

            {/* Evolución temporal */}
            <div className="space-y-3">
                <SectionTitle>Evolución temporal</SectionTitle>
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Evolución de incidentes urgentes</CardTitle>
                                <CardDescription>
                                    Agrupado por {groupBy === "day" ? "día" : groupBy === "week" ? "semana" : "mes"}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Agrupar por:</span>
                                <Select value={groupBy} onValueChange={(v) => setGroupBy(v as TemporalGroupBy)}>
                                    <SelectTrigger className="w-[120px] h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="day">Por día</SelectItem>
                                        <SelectItem value="week">Por semana</SelectItem>
                                        <SelectItem value="month">Por mes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingExtended ? (
                            <div className="h-[240px] flex items-center justify-center">
                                <div className="size-6 border-2 border-muted border-t-red-500 rounded-full animate-spin" />
                            </div>
                        ) : temporalData.length === 0 ? (
                            <div className="h-[240px] flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Sin datos.</p>
                            </div>
                        ) : (
                            <ChartContainer config={urgentTemporalChartConfig} className="h-[240px] w-full">
                                <BarChart accessibilityLayer data={temporalData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="period" tickLine={false} tickMargin={10} axisLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="Total" fill="#ef4444" radius={4} />
                                    <Bar dataKey="Cerrados" fill="#f97316" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Operadores */}
            <div className="space-y-3">
                <SectionTitle>Operadores</SectionTitle>
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="size-4 text-muted-foreground" />
                                <div>
                                    <CardTitle className="text-base">Incidentes urgentes por operador</CardTitle>
                                    <CardDescription>Rendimiento en incidentes de alta prioridad</CardDescription>
                                </div>
                            </div>
                            {operatorData.length > 0 && (
                                <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                                    <SelectTrigger className="w-[180px] h-8 text-xs">
                                        <SelectValue placeholder="Todos los operadores" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">Todos</SelectItem>
                                        {operatorData.map((op) => (
                                            <SelectItem key={op.name} value={op.name}>{op.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingExtended ? (
                            <div className="h-[200px] flex items-center justify-center">
                                <div className="size-6 border-2 border-muted border-t-red-500 rounded-full animate-spin" />
                            </div>
                        ) : operatorData.length === 0 ? (
                            <div className="h-[200px] flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Sin operadores asignados.</p>
                            </div>
                        ) : (
                            <ChartContainer config={urgentOperatorChartConfig} className="w-full" style={{ height: Math.max(200, filteredOperatorData.length * 52) }}>
                                <BarChart data={filteredOperatorData} layout="vertical" margin={{ top: 0, right: 32, left: 8, bottom: 0 }}>
                                    <CartesianGrid horizontal={false} />
                                    <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="Asignados" fill="#ef4444" radius={4} />
                                    <Bar dataKey="Resueltos" fill="#f97316" radius={4} />
                                    <Bar dataKey="Cerrados" fill="#fbbf24" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Frecuencia por categoría */}
            <div className="space-y-3">
                <SectionTitle>Análisis por categoría</SectionTitle>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Urgentes por categoría</CardTitle>
                        <CardDescription>Distribución de estados en incidentes de alta prioridad</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {frequencyBarData.length === 0 ? (
                            <div className="h-[280px] flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Sin datos.</p>
                            </div>
                        ) : (
                            <ChartContainer config={urgentStatusChartConfig} className="w-full" style={{ height: Math.max(280, frequencyBarData.length * 48) }}>
                                <BarChart data={frequencyBarData} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 0 }}>
                                    <CartesianGrid horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="Abierto" stackId="a" fill="#ef4444" />
                                    <Bar dataKey="Asignado" stackId="a" fill="#f97316" />
                                    <Bar dataKey="Resuelto" stackId="a" fill="#fbbf24" />
                                    <Bar dataKey="Cerrado" stackId="a" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Resolución urgentes por categoría</CardTitle>
                        <CardDescription>Tasa de cierre y tiempo promedio en alta prioridad</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {resolutionBarData.length === 0 ? (
                            <div className="h-[280px] flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Sin datos.</p>
                            </div>
                        ) : (
                            <ChartContainer config={urgentResolutionChartConfig} className="w-full" style={{ height: Math.max(280, resolutionBarData.length * 48) }}>
                                <BarChart data={resolutionBarData} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 0 }}>
                                    <CartesianGrid horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="TasaCierre" fill="#ef4444" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="TiempoPromedio" fill="#f97316" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Distribución geográfica */}
            {(geographic?.withSubDistrict?.length ?? 0) > 0 && (
                <div className="space-y-3">
                    <SectionTitle>Distribución geográfica</SectionTitle>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <MapPin className="size-4 text-muted-foreground" />
                                <div>
                                    <CardTitle className="text-base">Urgentes por barrio</CardTitle>
                                    <CardDescription>Concentración geográfica de incidentes críticos</CardDescription>
                                </div>
                            </div>
                            {(geographic?.withoutSubDistrict ?? 0) > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {geographic!.withoutSubDistrict} incidente{geographic!.withoutSubDistrict !== 1 ? "s" : ""} sin barrio asignado
                                </p>
                            )}
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={urgentStatusChartConfig} className="w-full" style={{ height: Math.max(280, geoBarData.length * 48) }}>
                                <BarChart data={geoBarData} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 0 }}>
                                    <CartesianGrid horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="Abierto" stackId="a" fill="#ef4444" />
                                    <Bar dataKey="Asignado" stackId="a" fill="#f97316" />
                                    <Bar dataKey="Resuelto" stackId="a" fill="#fbbf24" />
                                    <Bar dataKey="Cerrado" stackId="a" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}