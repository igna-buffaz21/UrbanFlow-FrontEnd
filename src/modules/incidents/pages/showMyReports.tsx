import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  Flag,
  FlagOff,
  Users,
  FileX,
  Clock,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { IncidentDetailDialog } from "@/components/dialog-incident";

import { incidentsService } from "../incidents.service";
import type { ReportedIncidentResponse } from "../incidents.type";

type IncidentStatus =
  | "open"
  | "in_review"
  | "in_progress"
  | "resolved"
  | "rejected";

type IncidentPriority = "low" | "medium" | "high" | "critical";

type StatusConfig = {
  label: string;
  icon: ReactNode;
};

type PriorityConfig = {
  label: string;
  dotClass: string;
};

const STATUS_CONFIG = {
  open: {
    label: "Abierto",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  in_review: {
    label: "En revisión",
    icon: <Clock className="h-3 w-3" />,
  },
  in_progress: {
    label: "En progreso",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  resolved: {
    label: "Resuelto",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  rejected: {
    label: "Rechazado",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
} satisfies Record<IncidentStatus, StatusConfig>;

const PRIORITY_CONFIG = {
  low: {
    label: "Baja",
    dotClass: "bg-green-500",
  },
  medium: {
    label: "Media",
    dotClass: "bg-yellow-500",
  },
  high: {
    label: "Alta",
    dotClass: "bg-orange-500",
  },
  critical: {
    label: "Crítica",
    dotClass: "bg-red-500",
  },
} satisfies Record<IncidentPriority, PriorityConfig>;

function formatRelativeDate(date: string) {
  const now = new Date();
  const targetDate = new Date(date);

  const diffMs = now.getTime() - targetDate.getTime();
  const diffMinutes = Math.floor(diffMs / 1000 / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Recién";
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return targetDate.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isValidStatus(status: string): status is IncidentStatus {
  return status in STATUS_CONFIG;
}

function isValidPriority(priority: string): priority is IncidentPriority {
  return priority in PRIORITY_CONFIG;
}

function ReportCardSkeleton() {
  return (
    <div className="flex items-start gap-3 py-4 px-2">
      <Skeleton className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-px w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function ReportCard({
  report,
  onViewDetail,
  onRemove,
  isRemoving,
}: {
  report: ReportedIncidentResponse;
  onViewDetail: () => void;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const status = isValidStatus(report.incident.status)
    ? STATUS_CONFIG[report.incident.status]
    : STATUS_CONFIG.open;

  const priority = isValidPriority(report.incident.priority)
    ? PRIORITY_CONFIG[report.incident.priority]
    : PRIORITY_CONFIG.low;

  return (
    <button
      type="button"
      onClick={onViewDetail}
      disabled={isRemoving}
      className={cn(
        "w-full text-left group transition-opacity",
        isRemoving && "opacity-40 pointer-events-none"
      )}
    >
      <div className="flex items-start gap-3 py-4 px-2 transition-colors hover:bg-muted/40 rounded-lg">
        <div className="mt-1.5 flex-shrink-0">
          <span
            className={`block h-2 w-2 rounded-full ${priority.dotClass}`}
            title={`Prioridad: ${priority.label}`}
          />
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-sm font-medium leading-snug text-foreground truncate pr-2">
            {report.incident.title}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className="text-xs gap-1 py-0 h-5 font-normal"
            >
              {status.icon}
              {status.label}
            </Badge>

            <Badge
              variant="secondary"
              className="text-xs gap-1 py-0 h-5 font-normal border-red-200 bg-red-50 text-red-600"
            >
              <Flag className="size-3" />
              Reportado
            </Badge>

            <span className="text-xs text-muted-foreground">
              {formatRelativeDate(report.reportedAt)}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4 shrink-0" />
              <span>Reportado por vos</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isRemoving}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="shrink-0 gap-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
            >
              <FlagOff className="size-3.5" />
              Quitar reporte
            </Button>
          </div>
        </div>

        <div className="mt-0.5 flex-shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </div>
    </button>
  );
}

export function ShowReportsCitizen() {
  const navigate = useNavigate();

  const [reports, setReports] = useState<ReportedIncidentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    null
  );
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        setError(null);

        const response = await incidentsService.getMyReports();
        setReports(response);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los reportes"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, []);

  function handleOpenDetail(incidentId: string) {
    setSelectedIncidentId(incidentId);
    setIsDetailDialogOpen(true);
  }

  async function handleRemoveReport(reportId: string) {
    setRemovingIds((prev) => {
      const next = new Set(prev);
      next.add(reportId);
      return next;
    });

    try {
      //await incidentsService.removeReport(reportId);

      setReports((prev) => prev.filter((report) => report.reportId !== reportId));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo quitar el reporte"
      );
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 text-muted-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>

        <h1 className="text-xl font-semibold tracking-tight">Mis reportes</h1>

        <p className="text-sm text-muted-foreground mt-0.5">
          Incidentes que reportaste de otros usuarios
        </p>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {loading && (
          <div className="divide-y divide-border px-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <ReportCardSkeleton key={index} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive/60" />

            <div>
              <p className="text-sm font-medium">Ocurrió un error</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
            <FileX className="h-8 w-8 text-muted-foreground/40" />

            <div>
              <p className="text-sm font-medium">Sin reportes</p>
              <p className="text-xs text-muted-foreground mt-1">
                Todavía no reportaste ningún incidente de otro usuario.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="px-2 divide-y divide-border">
            {reports.map((report) => (
              <ReportCard
                key={report.reportId}
                report={report}
                onViewDetail={() => handleOpenDetail(report.incident.id)}
                onRemove={() => handleRemoveReport(report.reportId)}
                isRemoving={removingIds.has(report.reportId)}
              />
            ))}
          </div>
        )}
      </div>

      {!loading && !error && reports.length > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          {reports.length} {reports.length === 1 ? "reporte" : "reportes"} en
          total
        </p>
      )}

      <IncidentDetailDialog
        incidentId={selectedIncidentId}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
    </div>
  );
}