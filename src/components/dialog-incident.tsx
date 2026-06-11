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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { incidentsService } from "@/modules/incidents/incidents.service";
import {
  CalendarDays,
  Flag,
  ImageOff,
  MessageSquare,
  MoreHorizontal,
  Trash2,
  User,
  Users,
  XIcon,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { IncidentCommentResponse, IncidentDetailResponse, IncidentReportResponse } from "@/modules/incidents/incidents.type";
import { Textarea } from "@/components/ui/textarea";

type IncidentPriority = "low" | "medium" | "high";

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

function formatRelativeDate(date: string) {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} días`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function IncidentDetailDialog({
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
  const [isReporting, setIsReporting] = useState(false);
  const [commentValue, setCommentValue] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !incidentId) return;

    async function getIncidentDetail() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [incidentData, reportData, commentsData] = await Promise.all([
          incidentsService.getDetailIncidentById(incidentId!!),
          incidentsService.getIncidentReport(incidentId!!),
          incidentsService.getIncidentComments(incidentId!!),
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
      setCommentValue("");
      setCommentError(null);
    }
  }

  async function handleDelete() {
    if (!incidentId) return;
    try {
      setIsDeleting(true);
      // await incidentsService.changeStatusIncident(incidentId);
      setIsConfirmOpen(false);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo dar de baja el incidente.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggleReport() {
    if (!incidentId || !report) return;
    try {
      setIsReporting(true);
      if (report.reportedByMe) {
        await incidentsService.deleteIncidentReport(incidentId);
        setReport({
          reportedByMe: false,
          reportsCount: Math.max(0, report.reportsCount - 1),
        });
      } else {
        await incidentsService.addIncidentReport(incidentId);
        setReport({
          reportedByMe: true,
          reportsCount: report.reportsCount + 1,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsReporting(false);
    }
  }

  async function handleCreateComment(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!incidentId) return;

  const trimmedComment = commentValue.trim();

  if (!trimmedComment) {
    setCommentError("El comentario no puede estar vacío.");
    return;
  }

  try {
    setIsCommenting(true);
    setCommentError(null);

    const response = await incidentsService.addCommentReport(incidentId, trimmedComment);

    setComments((prevComments) => [response, ...prevComments]);
    setCommentValue("");
  } catch (error) {
    console.error(error);
    setCommentError("No se pudo publicar el comentario.");
  } finally {
    setIsCommenting(false);
  }
}

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col p-0" showCloseButton={false}>
          {/* Header — fijo */}
          <DialogHeader className="flex-row items-center justify-between px-6 pt-6 pb-4">
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

          {/* Contenido scrolleable */}
          <ScrollArea className="flex-1 overflow-auto">
            <div className="px-6 pb-6">
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
                  {/* Imagen */}
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

                  {/* Título y descripción */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={getPriorityBadgeClass(incident.priority)}
                      >
                        Prioridad {getPriorityLabel(incident.priority)}
                      </Badge>
                      {incident.category && (
                        <Badge variant="secondary">{incident.category.name}</Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {incident.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {incident.description}
                    </p>
                  </div>

                  <Separator />

                  {/* Sección reportes */}
                  {report && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="size-4 shrink-0" />
                        {report.reportsCount > 0 ? (
                          <span>
                            <span className="font-medium text-foreground">
                              {report.reportsCount}
                            </span>{" "}
                            {report.reportsCount === 1
                              ? "persona también reportó esto"
                              : "personas también reportaron esto"}
                          </span>
                        ) : (
                          <span>Sé el primero en reportar este incidente</span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isReporting}
                        onClick={handleToggleReport}
                        className={cn(
                          "shrink-0 gap-2",
                          report.reportedByMe &&
                            "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                        )}
                      >
                        <Flag className="size-3.5" />
                        {report.reportedByMe ? "Reportado" : "Reportar"}
                      </Button>
                    </div>
                  )}

                  <Separator />

                  {/* Sección comentarios */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <MessageSquare className="size-4 text-muted-foreground" />
                      Comentarios
                      {comments.length > 0 && (
                        <span className="font-normal text-muted-foreground">
                          ({comments.length})
                        </span>
                      )}
                    </div>

                    {comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Todavía no hay comentarios para este incidente.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {comments.map((c) => (
                          <div key={c.id} className="flex gap-3">
                            <Avatar className="size-8 shrink-0">
                              <AvatarImage
                                src={c.createdBy.photoUrl ?? undefined}
                                alt={c.createdBy.name}
                              />
                              <AvatarFallback className="text-xs">
                                {getInitials(c.createdBy.name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-medium text-foreground">
                                  {c.createdBy.name}
                                </span>

                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeDate(c.createdAt)}
                                </span>
                              </div>

                              <p className="rounded-lg rounded-tl-none bg-muted/50 px-3 py-2 text-sm leading-relaxed text-foreground">
                                {c.comment}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Crear comentario */}
                    <form onSubmit={handleCreateComment} className="space-y-2 border-t pt-4">
                      <Textarea
                        value={commentValue}
                        onChange={(event) => setCommentValue(event.target.value)}
                        placeholder="Escribí un comentario..."
                        disabled={isCommenting}
                        className="min-h-20 resize-none text-sm"
                      />

                      {commentError && (
                        <p className="text-xs text-destructive">{commentError}</p>
                      )}

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isCommenting || !commentValue.trim()}
                        >
                          {isCommenting ? "Publicando..." : "Comentar"}
                        </Button>
                      </div>
                    </form>
                  </div>

                  {/* Meta: autor y fecha — discreta, al pie */}
                  {/* Meta: autor y fecha — centradas */}
                    {/* Meta: autor y fecha */}
                    <div className="space-y-1 pt-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        {incident.createdBy?.photoUrl ? (
                          <img
                            src={incident.createdBy.photoUrl}
                            alt={incident.createdBy.name}
                            className="size-4 rounded-full object-cover"
                          />
                        ) : (
                          <User className="size-3.5" />
                        )}

                        <span>
                          Creado por:{" "}
                          <span className="font-medium text-foreground">
                            {incident.createdBy?.name ?? "Usuario desconocido"}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" />

                        <span>
                          Creado hace:{" "}
                          <span className="font-medium text-foreground">
                            {formatRelativeDate(incident.createdAt)}
                          </span>
                        </span>
                      </div>
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Dar de baja este incidente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El incidente será dado de baja y
              dejará de estar visible.
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