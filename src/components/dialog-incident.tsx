import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { incidentsService } from "@/modules/incidents/incidents.service";
import { CalendarDays, ImageOff, MoreHorizontal, Trash2, User, XIcon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

type IncidentPriority = "low" | "medium" | "high";

type IncidentDetail = {
  id: string;
  title: string;
  description: string;
  photoUrl: string | null;
  category: string | null;
  priority: IncidentPriority;
  createdAt: string;
  is_owner: boolean;
  createdBy: {
    id: string;
    name: string;
    photoUrl: string | null;
  };
};

type IncidentDetailDialogProps = {
  incidentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

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
    low: "bg-green-100 text-green-700 border-green-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    high: "bg-red-100 text-red-700 border-red-200",
  };

  return classes[priority];
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function IncidentDetailDialog({
  incidentId,
  open,
  onOpenChange,
}: IncidentDetailDialogProps) {
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!open || !incidentId) return;

    async function getIncidentDetail() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response = await incidentsService.getDetailIncidentById(incidentId!!);

        setIncident(response);
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
      setErrorMessage(null);
    }
  }

  async function handleDelete() {
    if (!incidentId) return;

    try {
      setIsDeleting(true);
      //await incidentsService.changeStatusIncident(incidentId);
      setIsConfirmOpen(false);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo dar de baja el incidente.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl" showCloseButton={false}>
          <DialogHeader className="flex-row items-center justify-between">
            <DialogTitle>Detalle del incidente</DialogTitle>

            <div className="flex items-center gap-1">
              {incident?.is_owner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Más opciones</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive gap-2"
                      onClick={() => setIsConfirmOpen(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Dar de baja
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <DialogClose asChild>
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
                  <XIcon className="h-4 w-4" />
                  <span className="sr-only">Cerrar</span>
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          {isLoading && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Cargando detalle...
            </div>
          )}

          {errorMessage && !isLoading && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          {incident && !isLoading && (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-xl border bg-muted/30">
                {incident.photoUrl ? (
                  <img
                    src={incident.photoUrl}
                    alt={incident.title}
                    className="h-64 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageOff className="size-8" />
                    <p className="text-sm">Este incidente no tiene imagen</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={getPriorityBadgeClass(incident.priority)}
                  >
                    Prioridad {getPriorityLabel(incident.priority)}
                  </Badge>

                  {incident.category && (
                    <Badge variant="secondary">{incident.category}</Badge>
                  )}
                </div>

                <h2 className="text-xl font-semibold text-foreground">
                  {incident.title}
                </h2>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {incident.description}
                </p>
              </div>

              <div className="grid gap-3 rounded-xl border bg-background p-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  {incident.createdBy.photoUrl ? (
                    <img
                      src={incident.createdBy.photoUrl}
                      alt={incident.createdBy.name}
                      className="size-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                      <User className="size-4 text-muted-foreground" />
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-muted-foreground">Reportado por</p>
                    <p className="text-sm font-medium text-foreground">
                      {incident.createdBy.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                    <CalendarDays className="size-4 text-muted-foreground" />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Fecha de creación
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(incident.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Dar de baja este incidente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El incidente será dado de baja
              y dejará de estar visible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Dando de baja..." : "Dar de baja"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}