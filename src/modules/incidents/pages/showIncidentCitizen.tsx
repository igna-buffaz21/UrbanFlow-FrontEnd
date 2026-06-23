import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { incidentsService } from "../incidents.service";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronRight,
  FileX,
  ArrowLeft,
} from "lucide-react";
import type { ReactNode } from "react";
import type { IncidentMe } from "../incidents.type";
import { IncidentDetailCitizenDialog } from "@/components/dialog-incident-citizen";

type IncidentStatus =
  | "open"
  | "in_review"
  | "in_progress"
  | "resolved"
  | "rejected"
  | "closed";

type IncidentPriority = "low" | "medium" | "high" | "critical";

type StatusFilter = IncidentStatus | "all";

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
  closed: {
    label: "Rechazado",
    icon: <AlertTriangle className="h-3 w-3" />,
  }
} satisfies Record<IncidentStatus, StatusConfig>;

const STATUS_FILTER_OPTIONS = [
  {
    value: "all",
    label: "Todos",
  },
  {
    value: "open",
    label: "Abiertos",
  },
  {
    value: "closed",
    label: "Resueltos",
  },
  {
    value: "rejected",
    label: "Rechazados",
  },
] satisfies Array<{
  value: StatusFilter;
  label: string;
}>;

const PRIORITY_CONFIG = {
  low: {
    label: "Baja",
    dotClass: "bg-slate-400",
  },
  medium: {
    label: "Media",
    dotClass: "bg-amber-400",
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

function getStatusConfig(status: IncidentMe["status"]): StatusConfig {
  if (status in STATUS_CONFIG) {
    return STATUS_CONFIG[status as IncidentStatus];
  }

  return STATUS_CONFIG.in_review;
}

function getPriorityConfig(priority: IncidentMe["priority"]): PriorityConfig {
  if (priority in PRIORITY_CONFIG) {
    return PRIORITY_CONFIG[priority as IncidentPriority];
  }

  return PRIORITY_CONFIG.low;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Justo ahora";
  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;

  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

function IncidentCard({
  incident,
  onClick,
}: {
  incident: IncidentMe;
  onClick: () => void;
}) {
  const status = getStatusConfig(incident.status);
  const priority = getPriorityConfig(incident.priority);

  return (
    <button onClick={onClick} className="w-full text-left group">
      <div className="flex items-start gap-3 py-4 px-2 transition-colors hover:bg-muted/40 rounded-lg">
        <div className="mt-1.5 flex-shrink-0">
          <span
            className={`block h-2 w-2 rounded-full ${priority.dotClass}`}
            title={`Prioridad: ${priority.label}`}
          />
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-sm font-medium leading-snug text-foreground truncate pr-2">
            {incident.title}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className="text-xs gap-1 py-0 h-5 font-normal"
            >
              {status.icon}
              {status.label}
            </Badge>

            <span className="text-xs text-muted-foreground">
              {formatRelativeDate(incident.createdAt)}
            </span>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground flex-shrink-0 mt-0.5 transition-colors" />
      </div>
    </button>
  );
}

function IncidentCardSkeleton() {
  return (
    <div className="flex items-start gap-3 py-4 px-2">
      <Skeleton className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function ShowIncidentsCitizen() {
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<IncidentMe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    null
  );
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredIncidents = useMemo(() => {
    if (statusFilter === "all") {
      return incidents;
    }

    return incidents.filter((incident) => incident.status === statusFilter);
  }, [incidents, statusFilter]);

  useEffect(() => {
    async function fetchIncidents() {
      try {
        setLoading(true);
        setError(null);

        const response = await incidentsService.getIncidentsCitizen();

        setIncidents(response);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los incidentes";

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchIncidents();
  }, []);

  function handleOpenDetail(id: string) {
    setSelectedIncidentId(id);
    setIsDetailDialogOpen(true);
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

        <h1 className="text-xl font-semibold tracking-tight">Mis incidentes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Seguimiento de tus reportes enviados
        </p>
      </div>

      {!loading && !error && incidents.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTER_OPTIONS.map((option) => {
            const isActive = statusFilter === option.value;

            return (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={isActive ? "default" : "outline"}
                className="h-8 whitespace-nowrap rounded-full px-3 text-xs"
                onClick={() => setStatusFilter(option.value)}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        {loading && (
          <div className="divide-y divide-border px-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <IncidentCardSkeleton key={index} />
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

        {!loading && !error && incidents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
            <FileX className="h-8 w-8 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium">Sin incidentes</p>
              <p className="text-xs text-muted-foreground mt-1">
                Todavía no reportaste ningún incidente.
              </p>
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          incidents.length > 0 &&
          filteredIncidents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
              <FileX className="h-8 w-8 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium">
                  No hay incidentes con este estado
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Probá seleccionando otro filtro.
                </p>
              </div>
            </div>
          )}

        {!loading && !error && filteredIncidents.length > 0 && (
          <div className="px-2 divide-y divide-border">
            {filteredIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                onClick={() => handleOpenDetail(incident.id)}
              />
            ))}
          </div>
        )}
      </div>

      {!loading && !error && incidents.length > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Mostrando {filteredIncidents.length} de {incidents.length}{" "}
          {incidents.length === 1 ? "incidente" : "incidentes"}
        </p>
      )}

      <IncidentDetailCitizenDialog
        incidentId={selectedIncidentId}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
    </div>
  );
}