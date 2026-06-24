import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { incidentsService } from "@/modules/incidents/incidents.service";
import {
  Ban,
  ImageOff,
  MessageSquare,
  Users,
  XIcon,
  AlertCircle,
  Images,
  CheckCircle2,
  Circle,
  Clock,
  UserCheck,
  XCircle,
  Lock,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import type {
  IncidentCommentResponse,
  IncidentDetailResponse,
  IncidentReportResponse,
} from "@/modules/incidents/incidents.type";

type IncidentPriority = "low" | "medium" | "high";

type IncidentDetailDialogProps = {
  incidentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type IncidentStatus =
  | "in_review"
  | "open"
  | "in_progress"
  | "resolved"
  | "assigned"
  | "closed"
  | "rejected";

// ─── Helpers de prioridad ────────────────────────────────────────────────────

function getPriorityLabel(priority: IncidentPriority) {
  const labels: Record<IncidentPriority, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
  };
  return labels[priority];
}

function getPriorityBadgeClass(priority: IncidentPriority) {
  const classes: Record<IncidentPriority, string> = {
    low: "bg-green-500/15 text-green-600 border-green-500/20",
    medium: "bg-amber-500/15 text-amber-600 border-amber-500/20",
    high: "bg-red-500/15 text-red-600 border-red-500/20",
  };
  return classes[priority];
}

function getPriorityDotClass(priority: IncidentPriority) {
  const classes: Record<IncidentPriority, string> = {
    low: "bg-green-500",
    medium: "bg-amber-500",
    high: "bg-red-500",
  };
  return classes[priority];
}

// ─── Formato de fecha ────────────────────────────────────────────────────────

function formatRelativeDate(date: string) {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} días`;
}

function formatAbsoluteDate(date: string) {
  return new Date(date).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Timeline ────────────────────────────────────────────────────────────────

type TimelineStep = {
  key: string;
  label: string;
  date: string;
  icon: React.ReactNode;
  dotClass: string;
  lineClass?: string;
  isLast: boolean;
};

function buildTimeline(incident: IncidentDetailResponse): TimelineStep[] {
  const steps: TimelineStep[] = [];

  const assignedAt = incident.assignedAt ? new Date(incident.assignedAt) : null;
  const startedAt = incident.startedAt ? new Date(incident.startedAt) : null;
  const resolvedAt = incident.resolvedAt ? new Date(incident.resolvedAt) : null;
  const closedAt = incident.closedAt ? new Date(incident.closedAt) : null;
  const rejectedAt = incident.rejectedAt ? new Date(incident.rejectedAt) : null;

  // Paso 1: Creado / Abierto (siempre)
  steps.push({
    key: "created",
    label: "Reportado",
    date: incident.createdAt,
    icon: <Circle className="size-3.5" />,
    dotClass: "bg-blue-500 text-blue-600",
    isLast: false,
  });

  // Rama rechazo: open → rejected
  if (rejectedAt) {
    steps.push({
      key: "rejected",
      label: "Rechazado",
      date: incident.rejectedAt!,
      icon: <XCircle className="size-3.5" />,
      dotClass: "bg-red-500 text-red-600",
      isLast: true,
    });
    steps[steps.length - 2].isLast = false;
    return steps;
  }

  // Paso 2: Asignado
  if (assignedAt) {
    steps.push({
      key: "assigned",
      label: "Asignado",
      date: incident.assignedAt!,
      icon: <UserCheck className="size-3.5" />,
      dotClass: "bg-violet-500 text-violet-600",
      isLast: false,
    });
  }

  // Paso 3: En progreso — solo si startedAt es posterior a assignedAt
  const startedIsValid = startedAt && assignedAt && startedAt > assignedAt;
  if (startedIsValid) {
    steps.push({
      key: "in_progress",
      label: "En progreso",
      date: incident.startedAt!,
      icon: <Clock className="size-3.5" />,
      dotClass: "bg-amber-500 text-amber-600",
      isLast: false,
    });
  }

  // Paso 4: Resuelto — solo si resolvedAt es posterior a assignedAt
  const resolvedIsValid = resolvedAt && assignedAt && resolvedAt > assignedAt;
  if (resolvedIsValid) {
    steps.push({
      key: "resolved",
      label: "Resuelto",
      date: incident.resolvedAt!.toString(),
      icon: <CheckCircle2 className="size-3.5" />,
      dotClass: "bg-green-500 text-green-600",
      isLast: false,
    });
  }

  // Paso 5: Cerrado — solo si closedAt es posterior a assignedAt
  const closedIsValid = closedAt && assignedAt && closedAt > assignedAt;
  if (closedIsValid) {
    steps.push({
      key: "closed",
      label: "Cerrado",
      date: incident.closedAt!.toString(),
      icon: <Lock className="size-3.5" />,
      dotClass: "bg-zinc-500 text-zinc-600",
      isLast: false,
    });
  }

  // Marcar el último
  if (steps.length > 0) {
    steps[steps.length - 1].isLast = true;
  }

  return steps;
}

function IncidentTimeline({ incident }: { incident: IncidentDetailResponse }) {
  const steps = buildTimeline(incident);

  return (
    <div className="rounded-xl border bg-muted/10 px-4 py-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
        Historial
      </p>
      <div className="flex flex-col gap-0">
        {steps.map((step, i) => {
          const isRejected = step.key === "rejected";
          const isClosed = step.key === "closed";
          const isResolved = step.key === "resolved";
          const isActive = i === steps.length - 1;

          const dotBg = isRejected
            ? "bg-red-500"
            : isClosed
              ? "bg-zinc-400"
              : isResolved
                ? "bg-green-500"
                : isActive
                  ? "bg-blue-500"
                  : "bg-muted-foreground/30";

          const textColor = isRejected
            ? "text-red-600"
            : isActive
              ? "text-foreground"
              : "text-muted-foreground";

          return (
            <div key={step.key} className="flex gap-3">
              {/* Dot + line */}
              <div className="flex flex-col items-center">
                <div
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${dotBg} ${isActive || isRejected || isClosed || isResolved ? "opacity-100" : "opacity-40"}`}
                >
                  <span className="text-white [&>svg]:size-3">
                    {step.icon}
                  </span>
                </div>
                {!step.isLast && (
                  <div className="mt-1 w-px flex-1 bg-border" />
                )}
              </div>

              {/* Content */}
              <div className={`pb-4 ${step.isLast ? "pb-0" : ""}`}>
                <p
                  className={`text-xs font-medium leading-5 ${textColor}`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {formatAbsoluteDate(step.date)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function IncidentDetailSkeleton() {
  return (
    <div>
      <Skeleton className="h-52 w-full rounded-none" />
      <div className="space-y-5 px-5 py-5">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export function IncidentDetailCitizenDialog({
  incidentId,
  open,
  onOpenChange,
}: IncidentDetailDialogProps) {
  const [incident, setIncident] = useState<IncidentDetailResponse | null>(null);
  const [report, setReport] = useState<IncidentReportResponse | null>(null);
  const [comments, setComments] = useState<IncidentCommentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRejectionReasonOpen, setIsRejectionReasonOpen] = useState(false);

  // Para ver foto original cuando ya está cerrado
  const [isOriginalPhotoOpen, setIsOriginalPhotoOpen] = useState(false);

  useEffect(() => {
    if (!open || !incidentId) return;

    const id = incidentId;

    async function getIncidentDetail() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [incidentData, reportData, commentsData] = await Promise.all([
          incidentsService.getDetailIncidentById(id),
          incidentsService.getIncidentReport(id),
          incidentsService.getIncidentComments(id),
        ]);

        setIncident(incidentData);
        setReport(reportData);
        setComments(commentsData);
      } catch (error) {
        console.error(error);
        setErrorMessage("No se pudo cargar el detalle del incidente.");
      } finally {
        setIsLoading(false);
      }
    }

    getIncidentDetail();
  }, [open, incidentId]);

  function handleOpenChange(value: boolean) {
    onOpenChange(value);

    if (!value) {
      setIncident(null);
      setReport(null);
      setComments([]);
      setErrorMessage(null);
      setIsConfirmOpen(false);
      setIsRejectionReasonOpen(false);
      setIsOriginalPhotoOpen(false);
    }
  }

  async function handleCancelIncident() {
    if (!incidentId) return;

    try {
      setIsDeleting(true);
      // await incidentsService.changeStatusIncident(incidentId);
      setIsConfirmOpen(false);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo cancelar el incidente.");
    } finally {
      setIsDeleting(false);
    }
  }

  // Cuando está cerrado, mostramos la foto de resolución como hero
  const isClosed = incident?.status === "closed";
  const heroPhotoUrl =
    isClosed && incident?.resolutionPhotoUrl
      ? incident.resolutionPhotoUrl
      : incident?.photoUrl;

  const hasOriginalPhoto = isClosed && incident?.photoUrl;
  const hasResolutionPhoto = isClosed && incident?.resolutionPhotoUrl;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="flex max-h-[92dvh] w-full max-w-lg flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:rounded-2xl"
          showCloseButton={false}
        >
          {/* Header */}
          <DialogHeader className="flex-row items-center justify-between border-b px-5 py-3.5">
            <DialogTitle className="text-sm">
              {isLoading || !incident ? (
                <Skeleton className="h-5 w-28" />
              ) : (
                <span className="inline-flex items-center gap-1">
                  <span className="font-mono text-xs text-muted-foreground/60">#</span>
                  <span className="font-semibold tracking-wide text-foreground">
                    {incident.publicCode}
                  </span>
                </span>
              )}
            </DialogTitle>

            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-muted-foreground"
              >
                <XIcon className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
              </Button>
            </DialogClose>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-auto">
            {isLoading && <IncidentDetailSkeleton />}

            {errorMessage && !isLoading && (
              <div className="mx-5 my-4 rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            {incident && !isLoading && (
              <div>
                {/* Hero image */}
                <div className="relative">
                  {heroPhotoUrl ? (
                    <img
                      src={heroPhotoUrl}
                      alt={incident.title}
                      className="h-52 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 w-full flex-col items-center justify-center gap-2 bg-muted/40 text-muted-foreground">
                      <ImageOff className="size-7" />
                      <p className="text-xs">Sin imagen</p>
                    </div>
                  )}

                  {/* Badges superpuestos */}
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <Badge
                      variant="outline"
                      className={`${getPriorityBadgeClass(incident.priority)} backdrop-blur-sm`}
                    >
                      <span
                        className={`mr-1.5 inline-block size-1.5 rounded-full ${getPriorityDotClass(incident.priority)}`}
                      />
                      Prioridad {getPriorityLabel(incident.priority)}
                    </Badge>

                    {/* Botón ver foto original — solo cuando está cerrado y hay foto de resolución */}
                    {hasOriginalPhoto && hasResolutionPhoto && (
                      <button
                        onClick={() => setIsOriginalPhotoOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black/60"
                      >
                        <Images className="size-3" />
                        Ver foto original
                      </button>
                    )}
                  </div>

                  {/* Label "Foto de resolución" cuando está cerrado */}
                  {isClosed && hasResolutionPhoto && (
                    <div className="absolute right-3 top-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        <CheckCircle2 className="size-3" />
                        Foto de resolución
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-5 px-5 pb-8 pt-4">
                  {/* Category + title + description */}
                  <div className="space-y-1.5">
                    {incident.category && (
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                        {incident.category.name}
                      </p>
                    )}

                    <h2 className="text-lg font-semibold leading-snug text-foreground">
                      {incident.title}
                    </h2>

                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {incident.description}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border bg-muted/20 p-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="size-3.5" />
                        Reportes
                      </div>
                      <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
                        {report?.reportsCount ?? 0}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {report?.reportsCount === 1
                          ? "persona reportó"
                          : "personas reportaron"}
                      </p>
                    </div>

                    <div className="rounded-2xl border bg-muted/20 p-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MessageSquare className="size-3.5" />
                        Comentarios
                      </div>
                      <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
                        {comments.length}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {comments.length === 1 ? "comentario" : "comentarios"}
                      </p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <IncidentTimeline incident={incident} />

                  {/* Botón ver motivo de rechazo */}
                  {incident.status === "rejected" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-2 border border-destructive/20 text-destructive/70 hover:border-destructive/40 hover:bg-destructive/8 hover:text-destructive"
                      onClick={() => setIsRejectionReasonOpen(true)}
                    >
                      <AlertCircle className="size-4" />
                      Ver motivo de rechazo
                    </Button>
                  )}

                  {/* Cancelar — solo si es dueño */}
                    {incident.is_owner &&
                    (incident.status === "open" || incident.status === "in_review") && (
                        <Button
                        variant="ghost"
                        size="sm"
                        className="w-full gap-2 border border-destructive/20 text-destructive/70 hover:border-destructive/40 hover:bg-destructive/8 hover:text-destructive"
                        onClick={() => setIsConfirmOpen(true)}
                        >
                        <Ban className="size-4" />
                        Cancelar incidente
                        </Button>
                    )}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog cancelar incidente */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar este incidente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El incidente será cancelado y
              dejará de estar visible como incidente activo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelIncident}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Cancelando..." : "Cancelar incidente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog motivo de rechazo */}
      <AlertDialog open={isRejectionReasonOpen} onOpenChange={setIsRejectionReasonOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Motivo de rechazo</AlertDialogTitle>
            <AlertDialogDescription>
              {incident?.rejectionReason?.trim() ? (
                incident.rejectionReason
              ) : (
                <span className="italic text-muted-foreground">
                  No se especificó un motivo de rechazo.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsRejectionReasonOpen(false)}>
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog foto original */}
      <Dialog open={isOriginalPhotoOpen} onOpenChange={setIsOriginalPhotoOpen}>
        <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-2xl p-0" showCloseButton={false}>
          <DialogHeader className="flex-row items-center justify-between border-b px-5 py-3.5">
            <DialogTitle className="text-sm font-medium">Foto original del reporte</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon-sm" className="rounded-full text-muted-foreground">
                <XIcon className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
              </Button>
            </DialogClose>
          </DialogHeader>
          {incident?.photoUrl ? (
            <img
              src={incident.photoUrl}
              alt="Foto original del incidente"
              className="w-full object-contain"
            />
          ) : (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <ImageOff className="size-7" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}