import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  AlertCircle,
  Building2,
  Clock3,
  FileWarning,
  Globe2,
  Landmark,
  MessageSquare,
  RefreshCw,
  UserCheck,
  Users,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { systemService } from "@/modules/system/system.service";
import type { SystemOverview } from "@/modules/system/system.types";

const REFRESH_INTERVAL_MS = 60_000;

const userStatusItems = [
  { key: "active", label: "Activos" },
  { key: "pending", label: "Pendientes" },
  { key: "inactive", label: "Inactivos" },
  { key: "blocked", label: "Bloqueados" },
] as const;

const incidentStatusItems = [
  { key: "in_review", label: "En revisión" },
  { key: "open", label: "Abiertos" },
  { key: "assigned", label: "Asignados" },
  { key: "in_progress", label: "En progreso" },
  { key: "resolved", label: "Resueltos" },
  { key: "closed", label: "Cerrados" },
  { key: "rejected", label: "Rechazados" },
  { key: "canceled", label: "Cancelados" },
] as const;

const userStatusChartConfig = {
  active: { label: "Activos", color: "#059669" },
  pending: { label: "Pendientes", color: "#f59e0b" },
  inactive: { label: "Inactivos", color: "#64748b" },
  blocked: { label: "Bloqueados", color: "#dc2626" },
} satisfies ChartConfig;

const barChartConfig = {
  value: { label: "Total", color: "#2563eb" },
} satisfies ChartConfig;

const municipalityChartConfig = {
  active: { label: "Activos", color: "#059669" },
  inactive: { label: "Inactivos", color: "#dc2626" },
} satisfies ChartConfig;

interface SummaryCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  tone: string;
  isLoading: boolean;
}

interface StatItem {
  label: string;
  value: number;
}

interface ChartItem extends StatItem {
  key: string;
  fill: string;
  percent: number;
}

function formatNumber(value?: number) {
  return (value ?? 0).toLocaleString("es-AR");
}

function getRecordValue(record: Record<string, number> | undefined, key: string) {
  return record?.[key] ?? 0;
}

function getPercent(value: number, total: number) {
  if (total <= 0) return 0;

  return Math.round((value / total) * 100);
}

function formatGeneratedAt(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isOverviewEmpty(overview: SystemOverview | null) {
  if (!overview) return false;

  const values: number[] = [];

  function collectNumbers(value: unknown) {
    if (typeof value === "number") {
      values.push(value);
      return;
    }

    if (value && typeof value === "object") {
      Object.values(value).forEach(collectNumbers);
    }
  }

  collectNumbers(overview);

  return values.length > 0 && values.every((value) => value === 0);
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  tone,
  isLoading,
}: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            {isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <p className="text-3xl font-semibold tracking-tight">
                {formatNumber(value)}
              </p>
            )}
            {isLoading ? (
              <Skeleton className="h-4 w-40" />
            ) : (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>

          <div className={cn("rounded-lg border p-2", tone)}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function DonutChartCard({
  title,
  description,
  config,
  data,
}: {
  title: string;
  description: string;
  config: ChartConfig;
  data: ChartItem[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <ChartContainer config={config} className="mx-auto aspect-square h-[210px]">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name, item) => {
                    const payload = item.payload as ChartItem;

                    return (
                      <div className="flex min-w-32 items-center justify-between gap-4">
                        <span className="text-muted-foreground">{String(name)}</span>
                        <span className="font-medium">
                          {formatNumber(Number(value))} ({payload.percent}%)
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={58}
              outerRadius={86}
              paddingAngle={2}
              strokeWidth={4}
            />
          </PieChart>
        </ChartContainer>

        <div className="grid content-center gap-2">
          {data.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="shrink-0 text-sm font-medium">
                {item.percent}% · {formatNumber(item.value)}
              </span>
            </div>
          ))}
          {total === 0 ? (
            <p className="text-xs text-muted-foreground">
              Sin datos para calcular porcentajes.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function HorizontalBarChartCard({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: StatItem[];
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <ChartContainer config={barChartConfig} className="h-[280px] w-full">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
        >
          <CartesianGrid horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            dataKey="label"
            type="category"
            tickLine={false}
            axisLine={false}
            width={92}
            tickMargin={8}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          <Bar
            dataKey="value"
            fill="var(--color-value)"
            radius={[0, 4, 4, 0]}
            barSize={18}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-4 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SystemOverviewPage() {
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOverview() {
    try {
      setError(null);
      const data = await systemService.getOverview();
      setOverview(data);
    } catch (loadError) {
      console.error("Error cargando pantallazo global del sistema:", loadError);
      setError("No se pudo obtener el pantallazo global del sistema.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();

    const intervalId = window.setInterval(loadOverview, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const emptyOverview = isOverviewEmpty(overview);

  const engagementStats = useMemo(
    () => [
      { label: "Reportes totales", value: overview?.engagement.reports ?? 0 },
      { label: "Comentarios totales", value: overview?.engagement.comments ?? 0 },
      { label: "Comentarios visibles", value: overview?.engagement.visibleComments ?? 0 },
      { label: "Incidentes pendientes", value: overview?.engagement.pendingIncidents ?? 0 },
      {
        label: "Duplicados pendientes",
        value: overview?.engagement.pendingDuplicateConfirmations ?? 0,
      },
    ],
    [overview]
  );

  const userStatusChartData = useMemo(() => {
    const values = {
      active: overview?.users.active ?? getRecordValue(overview?.users.byStatus, "active"),
      pending: overview?.users.pending ?? getRecordValue(overview?.users.byStatus, "pending"),
      inactive: overview?.users.inactive ?? getRecordValue(overview?.users.byStatus, "inactive"),
      blocked: overview?.users.blocked ?? getRecordValue(overview?.users.byStatus, "blocked"),
    };
    const items = userStatusItems.map((item) => ({
      key: item.key,
      label: item.label,
      value: values[item.key],
      fill: String(userStatusChartConfig[item.key].color),
      percent: 0,
    }));
    const total = items.reduce((sum, item) => sum + item.value, 0);

    return items.map((item) => ({
      ...item,
      percent: getPercent(item.value, total),
    }));
  }, [overview]);

  const incidentStatusStats = useMemo(
    () =>
      incidentStatusItems.map((item) => ({
        label: item.label,
        value: getRecordValue(overview?.incidents.byStatus, item.key),
      })),
    [overview]
  );

  const municipalityChartData = useMemo(() => {
    const items = [
      {
        key: "active",
        label: "Activos",
        value: overview?.municipalities.active ?? 0,
        fill: String(municipalityChartConfig.active.color),
        percent: 0,
      },
      {
        key: "inactive",
        label: "Inactivos",
        value: overview?.municipalities.inactive ?? 0,
        fill: String(municipalityChartConfig.inactive.color),
        percent: 0,
      },
    ];
    const total = items.reduce((sum, item) => sum + item.value, 0);

    return items.map((item) => ({
      ...item,
      percent: getPercent(item.value, total),
    }));
  }, [overview]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Pantallazo global del sistema
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumen operativo de usuarios, incidentes, municipios y actividad ciudadana.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {overview?.generatedAt ? (
            <span className="text-xs text-muted-foreground">
              Actualizado: {formatGeneratedAt(overview.generatedAt)}
            </span>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            onClick={loadOverview}
            disabled={isLoading}
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Pantallazo no disponible</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <OverviewSkeleton />
      ) : emptyOverview ? (
        <Card>
          <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-2 p-6 text-center">
            <Globe2 className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Todavía no hay actividad global</p>
            <p className="max-w-md text-xs text-muted-foreground">
              Cuando el sistema empiece a registrar usuarios, incidentes y actividad,
              este pantallazo se va a completar automáticamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Usuarios totales"
              value={overview?.users.total ?? 0}
              description={`+${formatNumber(overview?.users.newLast7Days)} en los últimos 7 días`}
              icon={<Users className="size-5" />}
              tone="border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/35 dark:text-blue-300"
              isLoading={false}
            />
            <SummaryCard
              title="Incidentes totales"
              value={overview?.incidents.total ?? 0}
              description={`+${formatNumber(overview?.incidents.createdLast7Days)} en los últimos 7 días`}
              icon={<FileWarning className="size-5" />}
              tone="border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-300"
              isLoading={false}
            />
            <SummaryCard
              title="Municipios activos"
              value={overview?.municipalities.active ?? 0}
              description={`${formatNumber(overview?.municipalities.total)} municipios registrados`}
              icon={<Landmark className="size-5" />}
              tone="border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-300"
              isLoading={false}
            />
            <SummaryCard
              title="Incidentes activos"
              value={overview?.incidents.active ?? 0}
              description="Requieren seguimiento operativo"
              icon={<Clock3 className="size-5" />}
              tone="border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-900/60 dark:bg-violet-950/35 dark:text-violet-300"
              isLoading={false}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard
              title="Usuarios"
              description="Distribución de usuarios por estado."
              icon={<UserCheck className="size-4" />}
            >
              <DonutChartCard
                title="Usuarios por estado"
                description="Porcentaje de usuarios activos, pendientes, inactivos y bloqueados."
                config={userStatusChartConfig}
                data={userStatusChartData}
              />
            </SectionCard>

            <SectionCard
              title="Incidentes"
              description="Distribución operativa por estado."
              icon={<FileWarning className="size-4" />}
            >
              <HorizontalBarChartCard
                title="Distribución por estado"
                description="Cantidad de incidentes agrupados por su estado actual."
                data={incidentStatusStats}
              />
            </SectionCard>

            <SectionCard
              title="Municipios"
              description="Estado general de los municipios registrados."
              icon={<Building2 className="size-4" />}
            >
              <DonutChartCard
                title="Estado de municipios"
                description="Proporción de municipios activos e inactivos."
                config={municipalityChartConfig}
                data={municipalityChartData}
              />
            </SectionCard>

            <SectionCard
              title="Participación ciudadana"
              description="Interacciones y pendientes generados por la comunidad."
              icon={<MessageSquare className="size-4" />}
            >
              <HorizontalBarChartCard
                title="Actividad ciudadana"
                description="Volumen de reportes, comentarios y pendientes."
                data={engagementStats}
              />
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
