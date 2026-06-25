import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Clock3,
  Cpu,
  Database,
  HardDrive,
  MemoryStick,
  RefreshCw,
  Server,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

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
  type ChartConfig,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { systemService } from "@/modules/system/system.service";
import type {
  SystemCurrentMetrics,
  SystemHistoryRange,
  SystemHistorySnapshot,
} from "@/modules/system/system.types";

const REFRESH_INTERVAL_MS = 60_000;

const historyRangeOptions: { value: SystemHistoryRange; label: string }[] = [
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Año" },
];

const systemChartConfig = {
  cpuUsagePercent: { label: "CPU", color: "#2563eb" },
  memoryUsagePercent: { label: "Memoria", color: "#7c3aed" },
  diskUsagePercent: { label: "Disco", color: "#f59e0b" },
} satisfies ChartConfig;

const chartSeries = [
  { key: "cpuUsagePercent", label: "CPU", color: "#2563eb" },
  { key: "memoryUsagePercent", label: "Memoria", color: "#7c3aed" },
  { key: "diskUsagePercent", label: "Disco", color: "#f59e0b" },
] as const;

interface MetricCardProps {
  title: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  progress?: number;
  tone: string;
  progressTone?: string;
  isLoading: boolean;
}

interface TooltipPayloadItem {
  dataKey?: string | number;
  value?: number;
  color?: string;
  payload?: SystemHistorySnapshot & { label: string };
}

function formatPercent(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0%";

  return `${value.toFixed(1)}%`;
}

function formatMb(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0 MB";

  return `${value.toLocaleString("es-AR", { maximumFractionDigits: 0 })} MB`;
}

function formatGb(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0 GB";

  return `${value.toLocaleString("es-AR", { maximumFractionDigits: 1 })} GB`;
}

function formatUptime(seconds?: number) {
  if (!seconds || seconds < 0) return "0 min";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days} d ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes} min`;

  return `${minutes} min`;
}

function formatChartDate(value: string, range: SystemHistoryRange) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  if (range === "day") {
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (range === "year") {
    return date.toLocaleDateString("es-AR", {
      month: "short",
      year: "2-digit",
    });
  }

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
}

function formatTooltipDate(value?: string) {
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

function getServiceBadgeClass(status: string) {
  if (status === "online") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (status === "offline") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300";
}

function getServiceLabel(status: string) {
  if (status === "online") return "Online";
  if (status === "offline") return "Offline";

  return "Unknown";
}

function getServiceDotClass(status: string) {
  if (status === "online") return "bg-emerald-500";
  if (status === "offline") return "bg-red-500";

  return "bg-amber-500";
}

function ServiceStatusBadge({ status }: { status: string }) {
  const isOnline = status === "online";

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5", getServiceBadgeClass(status))}
    >
      <span className="relative flex size-2">
        {isOnline ? (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        ) : null}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            !isOnline && "animate-pulse",
            getServiceDotClass(status)
          )}
        />
      </span>
      {getServiceLabel(status)}
    </Badge>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon,
  progress,
  tone,
  progressTone,
  isLoading,
}: MetricCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </p>

            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-3xl font-semibold tracking-tight">{value}</p>
            )}

            {isLoading ? (
              <Skeleton className="h-4 w-36" />
            ) : (
              <p className="text-xs text-muted-foreground">{detail}</p>
            )}
          </div>

          <div className={cn("rounded-lg border p-2", tone)}>{icon}</div>
        </div>

        {typeof progress === "number" ? (
          <Progress
            className={cn("mt-4", progressTone)}
            value={Math.min(Math.max(progress, 0), 100)}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function EmptyHistoryState() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center">
      <Database className="size-7 text-muted-foreground" />
      <p className="text-sm font-medium">Todavía no hay métricas históricas</p>
      <p className="max-w-md text-xs text-muted-foreground">
        Los snapshots se generan automáticamente al iniciar el backend y luego
        cada 5 minutos.
      </p>
    </div>
  );
}

function SystemHistoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;

  if (!point) return null;

  return (
    <div className="min-w-56 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-2 font-medium">{formatTooltipDate(point.createdAt)}</p>

      <div className="grid gap-1.5">
        {payload.map((item) => {
          const key = String(item.dataKey);
          const config = systemChartConfig[key as keyof typeof systemChartConfig];

          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {config?.label ?? key}
              </span>
              <span className="font-medium">{formatPercent(item.value)}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 grid gap-1 border-t pt-2 text-muted-foreground">
        <div className="flex justify-between gap-4">
          <span>Memoria usada</span>
          <span>{formatMb(point.memoryUsedMb)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Memoria disponible</span>
          <span>{formatMb(point.memoryAvailableMb)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Disco usado</span>
          <span>{formatGb(point.diskUsedGb)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Disco libre</span>
          <span>{formatGb(point.diskFreeGb)}</span>
        </div>
      </div>
    </div>
  );
}

export function SystemMetricsPage() {
  const [currentMetrics, setCurrentMetrics] = useState<SystemCurrentMetrics | null>(null);
  const [history, setHistory] = useState<SystemHistorySnapshot[]>([]);
  const [selectedRange, setSelectedRange] = useState<SystemHistoryRange>("day");
  const [isCurrentLoading, setIsCurrentLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  async function loadCurrentMetrics() {
    try {
      setCurrentError(null);
      const data = await systemService.getCurrent();
      setCurrentMetrics(data);
      setLastUpdatedAt(new Date());
    } catch (error) {
      console.error("Error cargando métricas actuales:", error);
      setCurrentError("No se pudo obtener el estado actual del servidor.");
    } finally {
      setIsCurrentLoading(false);
    }
  }

  useEffect(() => {
    loadCurrentMetrics();

    const intervalId = window.setInterval(loadCurrentMetrics, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        setIsHistoryLoading(true);
        setHistoryError(null);
        const data = await systemService.getHistory({ range: selectedRange });

        if (isMounted) {
          setHistory(data);
        }
      } catch (error) {
        console.error("Error cargando historial de métricas:", error);

        if (isMounted) {
          setHistoryError("No se pudo obtener el historial de métricas.");
          setHistory([]);
        }
      } finally {
        if (isMounted) {
          setIsHistoryLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [selectedRange]);

  const chartData = useMemo(
    () =>
      history.map((snapshot) => ({
        ...snapshot,
        label: formatChartDate(snapshot.createdAt, selectedRange),
      })),
    [history, selectedRange]
  );

  const services = useMemo(() => {
    const preferredOrder = ["pm2", "nginx", "mongodb"];
    const serviceEntries = Object.entries(currentMetrics?.services ?? {});

    return serviceEntries.sort(([a], [b]) => {
      const aIndex = preferredOrder.indexOf(a);
      const bIndex = preferredOrder.indexOf(b);

      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }, [currentMetrics]);

  return (
    <div className="flex h-[calc(100svh-var(--header-height)-2rem)] w-full flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Estadísticas de uso
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Estado actual del servidor e historial de consumo del sistema.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lastUpdatedAt ? (
            <span className="text-xs text-muted-foreground">
              Actualizado {lastUpdatedAt.toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            onClick={loadCurrentMetrics}
            disabled={isCurrentLoading}
          >
            <RefreshCw className={cn("size-4", isCurrentLoading && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      </div>

      {currentError ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Estado actual no disponible</AlertTitle>
          <AlertDescription>{currentError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid shrink-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="CPU"
          value={formatPercent(currentMetrics?.cpu.usagePercent)}
          detail="Uso actual del procesador"
          icon={<Cpu className="size-5" />}
          progress={currentMetrics?.cpu.usagePercent}
          tone="border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/35 dark:text-blue-300"
          progressTone="[&_[data-slot=progress-indicator]]:bg-blue-500"
          isLoading={isCurrentLoading}
        />
        <MetricCard
          title="Memoria"
          value={formatPercent(currentMetrics?.memory.usagePercent)}
          detail={`${formatMb(currentMetrics?.memory.usedMb)} de ${formatMb(currentMetrics?.memory.totalMb)}`}
          icon={<MemoryStick className="size-5" />}
          progress={currentMetrics?.memory.usagePercent}
          tone="border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-900/60 dark:bg-violet-950/35 dark:text-violet-300"
          progressTone="[&_[data-slot=progress-indicator]]:bg-violet-500"
          isLoading={isCurrentLoading}
        />
        <MetricCard
          title="Disco"
          value={formatPercent(currentMetrics?.disk.usagePercent)}
          detail={`${formatGb(currentMetrics?.disk.usedGb)} de ${formatGb(currentMetrics?.disk.totalGb)}`}
          icon={<HardDrive className="size-5" />}
          progress={currentMetrics?.disk.usagePercent}
          tone="border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-300"
          progressTone="[&_[data-slot=progress-indicator]]:bg-amber-500"
          isLoading={isCurrentLoading}
        />
        <MetricCard
          title="Uptime"
          value={formatUptime(currentMetrics?.uptime.seconds)}
          detail="Tiempo activo del servidor"
          icon={<Clock3 className="size-5" />}
          tone="border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-300"
          isLoading={isCurrentLoading}
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="flex min-h-0 flex-col">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Historial de consumo</CardTitle>
              <CardDescription>
                CPU, memoria y disco registrados automáticamente cada 5 minutos.
              </CardDescription>
            </div>

            <Select
              value={selectedRange}
              onValueChange={(value) => setSelectedRange(value as SystemHistoryRange)}
            >
              <SelectTrigger size="sm" className="w-36">
                <SelectValue placeholder="Rango" />
              </SelectTrigger>
              <SelectContent>
                {historyRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col">
            {historyError ? (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Historial no disponible</AlertTitle>
                <AlertDescription>{historyError}</AlertDescription>
              </Alert>
            ) : isHistoryLoading ? (
              <Skeleton className="min-h-0 flex-1 w-full" />
            ) : chartData.length === 0 ? (
              <EmptyHistoryState />
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <div className="flex shrink-0 flex-wrap gap-3">
                  {chartSeries.map((series) => (
                    <div
                      key={series.key}
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
                    >
                      <span
                        className="h-2 w-5 rounded-full"
                        style={{ backgroundColor: series.color }}
                      />
                      {series.label}
                    </div>
                  ))}
                </div>

                <ChartContainer config={systemChartConfig} className="min-h-0 flex-1 w-full">
                  <LineChart
                    accessibilityLayer
                    data={chartData}
                    margin={{ top: 12, right: 12, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      minTickGap={32}
                    />
                    <YAxis
                      width={38}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                      domain={[0, 100]}
                    />
                    <ChartTooltip content={<SystemHistoryTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="cpuUsagePercent"
                      stroke="var(--color-cpuUsagePercent)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="memoryUsagePercent"
                      stroke="var(--color-memoryUsagePercent)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="diskUsagePercent"
                      stroke="var(--color-diskUsagePercent)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="size-4" />
              Servicios
            </CardTitle>
            <CardDescription>Estado reportado por el servidor.</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col">
            {isCurrentLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : services.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm text-muted-foreground">
                No hay servicios informados.
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-3">
                {services.map(([name, service]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Activity className="size-4 text-muted-foreground" />
                      <span className="truncate text-sm font-medium uppercase">
                        {name}
                      </span>
                    </div>
                    <ServiceStatusBadge status={service.status} />
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
