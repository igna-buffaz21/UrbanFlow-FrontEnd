import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";
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
    CartesianGrid,
} from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import {
    Users,
    UserCheck,
    UserX,
    TrendingUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CitizenStatItem {
    userId: string;
    name: string;
    email: string;
    photoUrl: string | null;
    totalIncidents: number;
    openIncidents: number;
    closedIncidents: number;
    rejectedIncidents: number;
}

interface CitizenStatsResult {
    totalCitizens: number;
    activeCitizens: number;
    blockedCitizens: number;
    newThisMonth: number;
    registrationByMonth: { period: string; total: number }[];
    topReporters: CitizenStatItem[];
}

const topReportersChartConfig = {
    totalIncidents: { label: "Total", color: "var(--chart-1)" },
    openIncidents: { label: "Abiertos", color: "var(--chart-2)" },
    closedIncidents: { label: "Cerrados", color: "var(--chart-3)" },
    rejectedIncidents: { label: "Rechazados", color: "var(--chart-4)" },
} satisfies ChartConfig;

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

export function CitizenStatsPage() {
    const [stats, setStats] = useState<CitizenStatsResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        async function load() {
            try {
                setIsLoading(true);
                const data = await api.get<CitizenStatsResult>(API_ROUTES.users.citizenStats).then(r => r.data);
                setStats(data);
            } catch (err) {
                console.error("Error cargando estadísticas de ciudadanos:", err);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const topReportersChartData = useMemo(() =>
        (stats?.topReporters ?? []).map(r => ({
            name: r.name.split(" ")[0],
            totalIncidents: r.totalIncidents,
            openIncidents: r.openIncidents,
            closedIncidents: r.closedIncidents,
            rejectedIncidents: r.rejectedIncidents,
        })),
        [stats]
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
                <h1 className="text-2xl font-semibold tracking-tight">Estadísticas de ciudadanos</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Actividad y participación de los ciudadanos de tu municipio
                </p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    title="Total ciudadanos"
                    value={stats?.totalCitizens ?? 0}
                    subtitle="Registrados en la app"
                    icon={<Users className="size-5" />}
                    iconColor="text-blue-500"
                />
                <MetricCard
                    title="Activos"
                    value={stats?.activeCitizens ?? 0}
                    subtitle="Con acceso habilitado"
                    icon={<UserCheck className="size-5" />}
                    iconColor="text-green-500"
                />
                <MetricCard
                    title="Bloqueados"
                    value={stats?.blockedCitizens ?? 0}
                    subtitle="Sin acceso a la app"
                    icon={<UserX className="size-5" />}
                    iconColor="text-red-500"
                />
                <MetricCard
                    title="Nuevos este mes"
                    value={stats?.newThisMonth ?? 0}
                    subtitle="Registros del mes actual"
                    icon={<TrendingUp className="size-5" />}
                    iconColor="text-orange-500"
                />
            </div>

            {/* Top reporters — gráfico */}
            <div className="space-y-3">
                <SectionTitle>Ciudadanos más activos</SectionTitle>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Ranking de reportes</CardTitle>
                        <CardDescription>Top 10 ciudadanos que más incidentes reportaron</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topReportersChartData.length === 0 ? (
                            <div className="h-[240px] flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Sin datos.</p>
                            </div>
                        ) : (
                            <ChartContainer config={topReportersChartConfig} className="h-[240px] w-full">
                                <BarChart accessibilityLayer data={topReportersChartData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="totalIncidents" fill="var(--color-totalIncidents)" radius={4} />
                                    <Bar dataKey="openIncidents" fill="var(--color-openIncidents)" radius={4} />
                                    <Bar dataKey="closedIncidents" fill="var(--color-closedIncidents)" radius={4} />
                                    <Bar dataKey="rejectedIncidents" fill="var(--color-rejectedIncidents)" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Top reporters — tabla detallada */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Detalle de reportes</CardTitle>
                        <CardDescription>Incidentes creados por cada ciudadano activo</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(stats?.topReporters ?? []).length === 0 ? (
                            <div className="h-[100px] flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Sin datos.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stats!.topReporters.map((reporter, i) => (
                                    <div key={reporter.userId} className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                                        <Avatar className="size-8">
                                            <AvatarImage src={reporter.photoUrl ?? undefined} />
                                            <AvatarFallback>{reporter.name.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{reporter.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{reporter.email}</p>
                                        </div>
                                        <div className="flex gap-3 text-xs text-right shrink-0">
                                            <div>
                                                <p className="font-semibold">{reporter.totalIncidents}</p>
                                                <p className="text-muted-foreground">Total</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-blue-500">{reporter.openIncidents}</p>
                                                <p className="text-muted-foreground">Abiertos</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-green-500">{reporter.closedIncidents}</p>
                                                <p className="text-muted-foreground">Cerrados</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-red-500">{reporter.rejectedIncidents}</p>
                                                <p className="text-muted-foreground">Rechazados</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}