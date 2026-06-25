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
    Bar, XAxis,
    YAxis,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart"
import {
    CheckCircle2,
    Clock4,
    Flame,
    TrendingUp,
    MapPin,
    Users,
} from "lucide-react";

const statusChartConfig = {
    Abierto: { label: "Abierto", color: "var(--chart-1)" },
    Asignado: { label: "Asignado", color: "var(--chart-2)" },
    Resuelto: { label: "Resuelto", color: "var(--chart-3)" },
    Cerrado: { label: "Cerrado", color: "var(--chart-4)" },
} satisfies ChartConfig

const resolutionChartConfig = {
    TasaCierre: { label: "Tasa de cierre (%)", color: "var(--chart-1)" },
    TiempoPromedio: { label: "Tiempo promedio (h)", color: "var(--chart-2)" },
} satisfies ChartConfig

const priorityChartConfig = {
    Alta: { label: "Alta", color: "var(--chart-1)" },
    Media: { label: "Media", color: "var(--chart-2)" },
    Baja: { label: "Baja", color: "var(--chart-3)" },
} satisfies ChartConfig

const PRIORITY_LABELS: Record<string, string> = {
    high: "Alta",
    medium: "Media",
    low: "Baja",
};

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const temporalChartConfig = {
    Total: { label: "Total", color: "var(--chart-1)" },
    Cerrados: { label: "Cerrados", color: "var(--chart-2)" },
} satisfies ChartConfig

const operatorChartConfig = {
    Asignados: { label: "Asignados", color: "var(--chart-1)" },
    Resueltos: { label: "Resueltos", color: "var(--chart-2)" },
    Cerrados: { label: "Cerrados", color: "var(--chart-3)" },
} satisfies ChartConfig

function formatPeriod(period: string, groupBy: "day" | "week" | "month"): string {
    const parts = period.split("-");
    if (groupBy === "week") {
        const parts = period.split("-W");
        return `Sem ${parts[1]} ${parts[0]}`;
    }
    if (groupBy === "day") {
        return `${parseInt(parts[2])}/${parseInt(parts[1])}`;
    }
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
        <Card>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                        <p className="text-3xl font-bold tracking-tight">{value}</p>
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    </div>
                    <div className={`p-2 rounded-lg bg-muted/50 ${iconColor}`}>{icon}</div>
                </div>
            </CardContent>
        </Card>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
            {children}
        </h2>
    );
}

export function IncidentStatsPage() {
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
                    api.get<FrequencyByCategoryResult[]>(API_ROUTES.incident_stats.frequency).then(r => r.data),
                    api.get<ResolutionMetricsResult>(API_ROUTES.incident_stats.resolution).then(r => r.data),
                    api.get<GeographicStatsResult>(API_ROUTES.incident_stats.geographic).then(r => r.data),
                ]);
                setFrequency(freqData);
                setResolution(resData);
                setGeographic(geoData);
            } catch (err) {
                console.error("Error cargando estadísticas:", err);
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
                    { params: { groupBy } }
                ).then(r => r.data);
                setExtended(extData);
            } catch (err) {
                console.error("Error cargando extended stats:", err);
            } finally {
                setIsLoadingExtended(false);
            }
        }
        loadExtended();
    }, [groupBy]);
    const overall = resolution?.overall;

    const frequencyBarData = useMemo(() =>
        frequency.filter(f => f.categoryName !== "Sin categoría").map(f => ({
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
        (resolution?.byCategory ?? []).filter(c => c.categoryName !== "Sin categoría").map(c => ({
            name: c.categoryLabel ?? c.categoryName ?? "Sin categoría",
            TasaCierre: parseFloat(c.closureRate.toFixed(1)),
            TiempoPromedio: c.avgResolutionHours !== null ? parseFloat(c.avgResolutionHours.toFixed(1)) : null,
        })).sort((a, b) => b.TasaCierre - a.TasaCierre),
        [resolution]
    );

    const temporalData = useMemo(() =>
        (extended?.temporal ?? []).map(t => ({
            period: formatPeriod(t.period, groupBy), Total: t.total,
            Cerrados: t.closed ?? 0,
        })),
        [extended, groupBy]);

    const operatorData = useMemo(() =>
        (extended?.byOperator ?? []).map(o => ({
            name: o.operatorName,
            Asignados: o.total,
            Resueltos: o.resolved,
            Cerrados: o.closed,
            "Tiempo prom. (h)": o.avgResolutionHours,
        })),
        [extended]
    );

    const priorityData = useMemo(() =>
        (extended?.byPriority ?? []).map(p => ({
            name: PRIORITY_LABELS[p.priority] ?? p.priority,
            value: p.total,
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
                    <div className="size-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
                    <p className="text-sm font-medium text-foreground">Cargando estadísticas...</p>
                    <p className="text-xs text-muted-foreground">Estamos procesando la información de tu municipio</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Estadísticas</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Análisis detallado de incidentes de tu municipalidad
                </p>
            </div>

            {/* KPIs */}
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
                    subtitle="Incidentes críticos"
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

            {/* Evolución temporal */}
            <div className="space-y-3">
                <SectionTitle>Evolución temporal</SectionTitle>
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Evolución de incidentes</CardTitle>
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
                                <div className="size-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
                            </div>
                        ) : frequencyBarData.length === 0 ? (
                            <div className="h-[280px] flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Sin datos.</p>
                            </div>
                        ) : (
                            <ChartContainer config={temporalChartConfig} className="h-[240px] w-full">
                                <BarChart accessibilityLayer data={temporalData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="period"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />                                    <Bar dataKey="Total" fill="var(--color-Total)" radius={4} />
                                    <Bar dataKey="Cerrados" fill="var(--color-Cerrados)" radius={4} />                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Distribución por prioridad + Operadores */}
            <div className="space-y-3">
                <SectionTitle>Prioridad y operadores</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Distribución por prioridad</CardTitle>
                            <CardDescription>Total de incidentes según su nivel de prioridad</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center">
                            {priorityData.length === 0 ? (
                                <div className="h-[220px] flex items-center justify-center">
                                    <p className="text-sm text-muted-foreground">Sin datos.</p>
                                </div>
                            ) : (
                                <ChartContainer config={priorityChartConfig} className="h-[200px] w-full">
                                    <PieChart>
                                        <Pie
                                            data={priorityData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={3}
                                            dataKey="value"
                                            nameKey="name"
                                        >
                                            {priorityData.map((_, index) => (
                                                <Cell
                                                    key={index}
                                                    fill={`var(--color-${priorityData[index].name})`}
                                                />
                                            ))}
                                        </Pie>
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <ChartLegend content={<ChartLegendContent />} />                                    </PieChart>
                                </ChartContainer>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="size-4 text-muted-foreground" />
                                    <div>
                                        <CardTitle className="text-base">Incidentes por operador</CardTitle>
                                        <CardDescription>Rendimiento de cada operador asignado</CardDescription>
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
                                                <SelectItem key={op.name} value={op.name}>
                                                    {op.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingExtended ? (
                                <div className="h-[240px] flex items-center justify-center">
                                    <div className="size-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
                                </div>
                            ) : operatorData.length === 0 ? (
                                <div className="h-[200px] flex items-center justify-center">
                                    <p className="text-sm text-muted-foreground">Sin operadores asignados.</p>
                                </div>
                            ) : (
                                <ChartContainer config={operatorChartConfig} className="w-full" style={{ height: Math.max(200, filteredOperatorData.length * 52) }}>
                                    <BarChart data={filteredOperatorData} layout="vertical" margin={{ top: 0, right: 32, left: 8, bottom: 0 }}>
                                        <CartesianGrid horizontal={false} />
                                        <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 11 }} />
                                        <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                                        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                                        <Bar dataKey="Asignados" fill="var(--color-Asignados)" radius={4} />
                                        <Bar dataKey="Resueltos" fill="var(--color-Resueltos)" radius={4} />
                                        <Bar dataKey="Cerrados" fill="var(--color-Cerrados)" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Frecuencia por categoría */}
            <div className="space-y-3">
                <SectionTitle>Análisis por categoría</SectionTitle>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Incidentes por categoría</CardTitle>
                        <CardDescription>Distribución de estados en cada categoría</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingExtended ? (
                            <div className="h-[240px] flex items-center justify-center">
                                <div className="size-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
                            </div>
                        ) : temporalData.length === 0 ? (
                            <div className="h-[280px] flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Sin datos.</p>
                            </div>
                        ) : (
                            <ChartContainer config={statusChartConfig} className="w-full" style={{ height: Math.max(280, frequencyBarData.length * 48) }}>
                                <BarChart data={frequencyBarData} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 0 }}>
                                    <CartesianGrid horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />                                    <Bar dataKey="Abierto" stackId="a" fill="var(--color-Abierto)" />
                                    <Bar dataKey="Asignado" stackId="a" fill="var(--color-Asignado)" />
                                    <Bar dataKey="Resuelto" stackId="a" fill="var(--color-Resuelto)" />
                                    <Bar dataKey="Cerrado" stackId="a" fill="var(--color-Cerrado)" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Resolución por categoría</CardTitle>
                        <CardDescription>Tasa de cierre y tiempo promedio de resolución</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingExtended ? (
                            <div className="h-[240px] flex items-center justify-center">
                                <div className="size-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
                            </div>
                        ) : resolutionBarData.length === 0 ? (
                            <div className="h-[280px] flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Sin datos.</p>
                            </div>
                        ) : (
                            <ChartContainer config={resolutionChartConfig} className="w-full" style={{ height: Math.max(280, resolutionBarData.length * 48) }}>
                                <BarChart data={resolutionBarData} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 0 }}>
                                    <CartesianGrid horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />                                    <Bar dataKey="TasaCierre" fill="var(--color-TasaCierre)" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="TiempoPromedio" fill="var(--color-TiempoPromedio)" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Incidentes por barrio */}
            {(geographic?.withSubDistrict?.length ?? 0) > 0 && (
                <div className="space-y-3">
                    <SectionTitle>Distribución geográfica</SectionTitle>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <MapPin className="size-4 text-muted-foreground" />
                                <div>
                                    <CardTitle className="text-base">Incidentes por barrio</CardTitle>
                                    <CardDescription>Distribución geográfica por barrios</CardDescription>
                                </div>
                            </div>
                            {(geographic?.withoutSubDistrict ?? 0) > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {geographic!.withoutSubDistrict} incidente{geographic!.withoutSubDistrict !== 1 ? "s" : ""} sin barrio asignado
                                </p>
                            )}
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={statusChartConfig} className="w-full" style={{ height: Math.max(280, geoBarData.length * 48) }}>
                                <BarChart data={geoBarData} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 0 }}>
                                    <CartesianGrid horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="Abierto" stackId="a" fill="var(--color-Abierto)" />
                                    <Bar dataKey="Asignado" stackId="a" fill="var(--color-Asignado)" />
                                    <Bar dataKey="Resuelto" stackId="a" fill="var(--color-Resuelto)" />
                                    <Bar dataKey="Cerrado" stackId="a" fill="var(--color-Cerrado)" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}