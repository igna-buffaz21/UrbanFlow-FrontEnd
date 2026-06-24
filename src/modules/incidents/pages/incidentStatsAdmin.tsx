import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";
import type {
    FrequencyByCategoryResult,
    ResolutionMetricsResult,
    GeographicStatsResult,
    ExtendedStatsResult,
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
    Legend,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    CheckCircle2,
    Clock4,
    Flame,
    TrendingUp,
    MapPin,
    Users,
} from "lucide-react";

const BAR_COLORS = {
    Abierto: "#3b82f6",
    Asignado: "#a855f7",
    Resuelto: "#22c55e",
    Cerrado: "#94a3b8",
};

const PRIORITY_COLORS: Record<string, string> = {
    high: "#ef4444",
    medium: "#f97316",
    low: "#3b82f6",
};

const PRIORITY_LABELS: Record<string, string> = {
    high: "Alta",
    medium: "Media",
    low: "Baja",
};

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function formatPeriod(period: string): string {
    const [year, month] = period.split("-");
    return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-popover border rounded-lg shadow-lg p-3 text-xs space-y-1.5">
            <p className="font-semibold text-foreground mb-2">{label}</p>
            {payload.map((entry: any) => (
                <div key={entry.dataKey ?? entry.name} className="flex items-center gap-2">
                    <span className="inline-block size-2 rounded-full" style={{ backgroundColor: entry.fill ?? entry.color }} />
                    <span className="text-muted-foreground">{entry.name}:</span>
                    <span className="font-medium text-foreground">
                        {entry.name?.includes("h)") && entry.value !== null
                            ? `${entry.value}h`
                            : entry.name?.includes("cierre")
                                ? `${entry.value}%`
                                : entry.value ?? "—"}
                    </span>
                </div>
            ))}
        </div>
    );
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

    useEffect(() => {
        async function load() {
            try {
                const [freqData, resData, geoData, extData] = await Promise.all([
                    api.get<FrequencyByCategoryResult[]>(API_ROUTES.incident_stats.frequency).then(r => r.data),
                    api.get<ResolutionMetricsResult>(API_ROUTES.incident_stats.resolution).then(r => r.data),
                    api.get<GeographicStatsResult>(API_ROUTES.incident_stats.geographic).then(r => r.data),
                    api.get<ExtendedStatsResult>(API_ROUTES.incident_stats.extended).then(r => r.data),
                ]);
                setFrequency(freqData);
                setResolution(resData);
                setGeographic(geoData);
                setExtended(extData);
            } catch (err) {
                console.error("Error cargando estadísticas:", err);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

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
            "Tasa de cierre (%)": parseFloat(c.closureRate.toFixed(1)),
            "Tiempo promedio (h)": c.avgResolutionHours !== null ? parseFloat(c.avgResolutionHours.toFixed(1)) : null,
        })).sort((a, b) => b["Tasa de cierre (%)"] - a["Tasa de cierre (%)"]),
        [resolution]
    );

    const temporalData = useMemo(() =>
        (extended?.temporal ?? []).map(t => ({
            period: formatPeriod(t.period),
            Total: t.total,
            Resuelto: t.resolved,
            Cerrado: t.closed,
        })),
        [extended]
    );

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
            color: PRIORITY_COLORS[p.priority] ?? "#94a3b8",
        })),
        [extended]
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
            <div className="p-6 space-y-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-5">
                                <div className="h-20 animate-pulse bg-muted rounded-md" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-5">
                            <div className="h-48 animate-pulse bg-muted rounded-md" />
                        </CardContent>
                    </Card>
                ))}
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
                        <CardTitle className="text-base">Incidentes por mes</CardTitle>
                        <CardDescription>Cantidad de incidentes creados mensualmente</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {temporalData.length === 0 ? (
                            <div className="h-[240px] flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Sin datos.</p>
                            </div>
                        ) : temporalData.length === 1 ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={temporalData} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="period"
                                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, color: "var(--foreground)" }} />
                                    <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Resuelto" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Cerrado" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={temporalData} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="period"
                                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, color: "var(--foreground)" }} />
                                    <Line type="monotone" dataKey="Total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="Resuelto" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="Cerrado" stroke="#94a3b8" strokeWidth={2} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
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
                                <div className="w-full">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={priorityData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={85}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {priorityData.map((entry, index) => (
                                                    <Cell key={index} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (!active || !payload?.length) return null;
                                                    const d = payload[0];
                                                    return (
                                                        <div className="bg-popover border rounded-lg shadow-lg p-3 text-xs">
                                                            <p className="font-semibold">{d.name}</p>
                                                            <p className="text-muted-foreground mt-1">
                                                                {d.value} incidente{Number(d.value) !== 1 ? "s" : ""}
                                                            </p>
                                                        </div>
                                                    );
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex justify-center gap-4 mt-2">
                                        {priorityData.map((p, i) => (
                                            <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <span className="size-2.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                                                {p.name}: <span className="font-medium text-foreground">{p.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <Users className="size-4 text-muted-foreground" />
                                <div>
                                    <CardTitle className="text-base">Incidentes por operador</CardTitle>
                                    <CardDescription>Rendimiento de cada operador asignado</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {operatorData.length === 0 ? (
                                <div className="h-[200px] flex items-center justify-center">
                                    <p className="text-sm text-muted-foreground">Sin operadores asignados.</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={operatorData} layout="vertical" margin={{ top: 0, right: 32, left: 8, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }}
                                            axisLine={false} tickLine={false} allowDecimals={false} />
                                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "#94a3b8" }}
                                            axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, color: "#e2e8f0" }} />
                                        <Bar dataKey="Asignados" fill="#3b82f6" />
                                        <Bar dataKey="Resueltos" fill="#22c55e" />
                                        <Bar dataKey="Cerrados" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
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
                        {frequencyBarData.length === 0 ? (
                            <div className="h-[280px] flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Sin datos.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={frequencyBarData} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }}
                                        axisLine={false} tickLine={false} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11, fill: "#94a3b8" }}
                                        axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, color: "#e2e8f0" }} />
                                    <Bar dataKey="Abierto" stackId="a" fill={BAR_COLORS.Abierto} />
                                    <Bar dataKey="Asignado" stackId="a" fill={BAR_COLORS.Asignado} />
                                    <Bar dataKey="Resuelto" stackId="a" fill={BAR_COLORS.Resuelto} />
                                    <Bar dataKey="Cerrado" stackId="a" fill={BAR_COLORS.Cerrado} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Resolución por categoría</CardTitle>
                        <CardDescription>Tasa de cierre y tiempo promedio de resolución</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {resolutionBarData.length === 0 ? (
                            <div className="h-[280px] flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Sin datos.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={resolutionBarData} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }}
                                        axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11, fill: "#94a3b8" }}
                                        axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, color: "#e2e8f0" }} />
                                    <Bar dataKey="Tasa de cierre (%)" fill="#22c55e" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="Tiempo promedio (h)" fill="#f97316" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
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
                            <ResponsiveContainer width="100%" height={Math.max(280, geoBarData.length * 48)}>
                                <BarChart data={geoBarData} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }}
                                        axisLine={false} tickLine={false} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "#94a3b8" }}
                                        axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, color: "#e2e8f0" }} />
                                    <Bar dataKey="Abierto" stackId="a" fill={BAR_COLORS.Abierto} />
                                    <Bar dataKey="Asignado" stackId="a" fill={BAR_COLORS.Asignado} />
                                    <Bar dataKey="Resuelto" stackId="a" fill={BAR_COLORS.Resuelto} />
                                    <Bar dataKey="Cerrado" stackId="a" fill={BAR_COLORS.Cerrado} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}