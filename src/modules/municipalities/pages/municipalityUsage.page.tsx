import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileWarning,
  Gauge,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import { APP_ROUTES } from "@/config/app.routes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { municipalitiesService } from "@/modules/municipalities/municipalities.service";
import type {
  MunicipalityMonthlyUsage,
  MunicipalityUsageItem,
} from "@/modules/municipalities/municipalities.type";

const statusItems = [
  { key: "open", label: "Abiertos" },
  { key: "assigned", label: "Asignados" },
  { key: "in_progress", label: "En progreso" },
  { key: "resolved", label: "Resueltos" },
  { key: "closed", label: "Cerrados" },
  { key: "rejected", label: "Rechazados" },
  { key: "canceled", label: "Cancelados" },
] as const;

const priorityItems = [
  { key: "low", label: "Baja", color: "#059669" },
  { key: "medium", label: "Media", color: "#f59e0b" },
  { key: "high", label: "Alta", color: "#dc2626" },
] as const;

const statusChartConfig = {
  value: { label: "Incidentes", color: "#2563eb" },
} satisfies ChartConfig;

const priorityChartConfig = {
  low: { label: "Baja", color: "#059669" },
  medium: { label: "Media", color: "#f59e0b" },
  high: { label: "Alta", color: "#dc2626" },
} satisfies ChartConfig;

interface SummaryCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  tone: string;
}

function getCurrentMonth() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function formatNumber(value?: number, maximumFractionDigits = 0) {
  return (value ?? 0).toLocaleString("es-AR", { maximumFractionDigits });
}

function formatPercent(value?: number) {
  return `${formatNumber(value, 2)}%`;
}

function formatDate(value?: string | null) {
  if (!value) return "Sin incidentes";

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

function getRecordValue(record: Record<string, number> | undefined, key: string) {
  return record?.[key] ?? 0;
}

function getUsageTone(value: number) {
  if (value >= 100) {
    return {
      label: "Límite excedido",
      badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300",
      progress: "[&_[data-slot=progress-indicator]]:bg-red-500",
      icon: "border-red-100 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-300",
    };
  }

  if (value >= 80) {
    return {
      label: "Cerca del límite",
      badge: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/70 dark:bg-orange-950/40 dark:text-orange-300",
      progress: "[&_[data-slot=progress-indicator]]:bg-orange-500",
      icon: "border-orange-100 bg-orange-50 text-orange-600 dark:border-orange-900/60 dark:bg-orange-950/35 dark:text-orange-300",
    };
  }

  if (value >= 60) {
    return {
      label: "Atención",
      badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
      progress: "[&_[data-slot=progress-indicator]]:bg-amber-500",
      icon: "border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-300",
    };
  }

  return {
    label: "Normal",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
    progress: "[&_[data-slot=progress-indicator]]:bg-emerald-500",
    icon: "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-300",
  };
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  tone,
}: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className={cn("rounded-lg border p-2", tone)}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function UsageSkeleton() {
  return (
    <div className="space-y-5">
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
      <Skeleton className="h-40 w-full" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}

function UsageProgress({ usage }: { usage: MunicipalityUsageItem }) {
  const tone = getUsageTone(usage.incidents.usagePercent);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Uso mensual</CardTitle>
            <CardDescription>
              {formatNumber(usage.incidents.created)} / {formatNumber(usage.monthlyLimit)} incidentes ({formatPercent(usage.incidents.usagePercent)})
            </CardDescription>
          </div>
          <Badge variant="outline" className={tone.badge}>
            {usage.incidents.exceededLimit
              ? "Límite excedido"
              : usage.incidents.nearLimit
                ? "Cerca del límite"
                : tone.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress
          value={Math.min(Math.max(usage.incidents.usagePercent, 0), 100)}
          className={cn("h-2", tone.progress)}
        />
        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
          <div>
            <span className="font-medium text-foreground">
              {formatNumber(usage.incidents.remaining)}
            </span>{" "}
            restantes
          </div>
          <div>
            <span className="font-medium text-foreground">
              {formatNumber(usage.projection.averagePerDay, 2)}
            </span>{" "}
            promedio diario
          </div>
          <div>
            Proyección:{" "}
            <span className="font-medium text-foreground">
              {formatNumber(usage.projection.projectedMonthlyIncidents, 1)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusChart({ usage }: { usage: MunicipalityUsageItem }) {
  const data = statusItems.map((item) => ({
    label: item.label,
    value: getRecordValue(usage.incidents.byStatus, item.key),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribución por estado</CardTitle>
        <CardDescription>Incidentes creados en el mes agrupados por estado.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={statusChartConfig} className="h-[280px] w-full">
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
      </CardContent>
    </Card>
  );
}

function PriorityChart({ usage }: { usage: MunicipalityUsageItem }) {
  const data = priorityItems.map((item) => ({
    key: item.key,
    label: item.label,
    value: getRecordValue(usage.incidents.byPriority, item.key),
    fill: item.color,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribución por prioridad</CardTitle>
        <CardDescription>Composición del uso mensual por prioridad.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <ChartContainer config={priorityChartConfig} className="mx-auto aspect-square h-[220px]">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
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
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  {item.label}
                </span>
                <span className="text-sm font-medium">{formatNumber(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MunicipalityUsagePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [month, setMonth] = useState(getCurrentMonth());
  const [usageResponse, setUsageResponse] = useState<MunicipalityMonthlyUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadUsage() {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await municipalitiesService.getMunicipalityUsage(id, month);
      setUsageResponse(response);
    } catch (loadError) {
      console.error("Error cargando uso mensual del municipio:", loadError);
      setError("No se pudo obtener el uso mensual del municipio.");
      setUsageResponse(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsage();
  }, [id, month]);

  const usage = usageResponse?.municipalities[0] ?? null;
  const usageTone = getUsageTone(usage?.incidents.usagePercent ?? 0);
  const isEmpty = !isLoading && !error && (!usage || usage.incidents.created === 0);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => navigate(APP_ROUTES.panel.municipalities)}
          >
            <ArrowLeft className="size-4" />
            Municipios
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {usage?.municipality.name ?? "Uso mensual del municipio"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Control de incidentes creados durante el mes seleccionado.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {usageResponse?.generatedAt ? (
            <span className="text-xs text-muted-foreground">
              Actualizado: {formatDate(usageResponse.generatedAt)}
            </span>
          ) : null}
          <Input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="w-36"
          />
          <Button variant="outline" size="sm" onClick={loadUsage} disabled={isLoading}>
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Uso mensual no disponible</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <UsageSkeleton />
      ) : isEmpty ? (
        <Card>
          <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-2 p-6 text-center">
            <CalendarDays className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Sin uso registrado en {month}</p>
            <p className="max-w-md text-xs text-muted-foreground">
              Cuando este municipio cree incidentes durante el mes seleccionado,
              el detalle de consumo se va a mostrar acá.
            </p>
          </CardContent>
        </Card>
      ) : usage ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Incidentes creados"
              value={formatNumber(usage.incidents.created)}
              description={`Límite mensual: ${formatNumber(usage.monthlyLimit)}`}
              icon={<FileWarning className="size-5" />}
              tone={usageTone.icon}
            />
            <SummaryCard
              title="Uso consumido"
              value={formatPercent(usage.incidents.usagePercent)}
              description={`${formatNumber(usage.incidents.remaining)} incidentes restantes`}
              icon={<Gauge className="size-5" />}
              tone={usageTone.icon}
            />
            <SummaryCard
              title="Proyección mensual"
              value={formatNumber(usage.projection.projectedMonthlyIncidents, 1)}
              description={`${formatPercent(usage.projection.projectedUsagePercent)} proyectado`}
              icon={<ShieldAlert className="size-5" />}
              tone="border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-900/60 dark:bg-violet-950/35 dark:text-violet-300"
            />
            <SummaryCard
              title="Último incidente"
              value={usage.incidents.lastIncidentAt ? "Registrado" : "Sin datos"}
              description={formatDate(usage.incidents.lastIncidentAt)}
              icon={<Clock3 className="size-5" />}
              tone="border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/35 dark:text-blue-300"
            />
          </div>

          <UsageProgress usage={usage} />

          <div className="grid gap-4 xl:grid-cols-2">
            <StatusChart usage={usage} />
            <PriorityChart usage={usage} />
          </div>

          <Card>
            <CardContent className="grid gap-3 p-5 text-sm text-muted-foreground sm:grid-cols-3">
              <div>
                Municipio:{" "}
                <span className="font-medium text-foreground">
                  {usage.municipality.name}
                </span>
              </div>
              <div>
                Distrito:{" "}
                <span className="font-medium text-foreground">
                  {usage.municipality.district?.name ?? "Sin distrito"}
                </span>
              </div>
              <div>
                Estado:{" "}
                <Badge variant="outline">
                  {usage.municipality.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
