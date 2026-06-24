import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  MessageCircle,
  Trash2,
  FileX,
  ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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

import { cn } from "@/lib/utils";
import { IncidentDetailDialog } from "@/components/dialog-incident";
import { incidentsService } from "../incidents.service";

export interface MyIncidentCommentResponse {
  comment: string;
  photoUrl: string | null;
  status: "visible" | "hidden" | "deleted";
  commentId: string;
  incidentId: string;
  commentedAt: string;
  incidentTitle: string;
}

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

function CommentCardSkeleton() {
  return (
    <div className="flex items-start gap-3 py-4 px-2">
      <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />

      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />

        <Skeleton className="h-px w-full" />

        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-36 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  onViewDetail,
  onAskDelete,
  isDeleting,
}: {
  comment: MyIncidentCommentResponse;
  onViewDetail: () => void;
  onAskDelete: () => void;
  isDeleting: boolean;
}) {
  const isVisible = comment.status === "visible";

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (isDeleting) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onViewDetail();
    }
  }

  return (
    <div
      role="button"
      tabIndex={isDeleting ? -1 : 0}
      onClick={isDeleting ? undefined : onViewDetail}
      onKeyDown={handleKeyDown}
      className={cn(
        "w-full text-left group rounded-lg transition-colors outline-none",
        "hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDeleting && "opacity-40 pointer-events-none"
      )}
    >
      <div className="flex items-start gap-3 py-4 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted flex-shrink-0">
          <MessageCircle className="size-4 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="space-y-1">
            <p className="text-sm font-medium leading-snug text-foreground truncate pr-2">
              {comment.incidentTitle}
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {comment.comment}
            </p>
          </div>

          {comment.photoUrl && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImageIcon className="size-3.5" />
              <span>Comentario con imagen adjunta</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Comentaste este incidente</span>
            <span>•</span>
            <span>{formatRelativeDate(comment.commentedAt)}</span>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Tocá la tarjeta para ver el incidente
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting || !isVisible}
              onClick={(event) => {
                event.stopPropagation();
                onAskDelete();
              }}
              className="shrink-0 gap-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
            >
              <Trash2 className="size-3.5" />
              {isDeleting ? "Eliminando..." : "Eliminar comentario"}
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
    </div>
  );
}

export function ShowCommentsCitizen() {
  const navigate = useNavigate();

  const [comments, setComments] = useState<MyIncidentCommentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    null
  );
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const [commentToDelete, setCommentToDelete] =
    useState<MyIncidentCommentResponse | null>(null);

  useEffect(() => {
    async function fetchComments() {
      try {
        setLoading(true);
        setError(null);

        const response = await incidentsService.getMyComments();

        console.log(response)

        setComments(response);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar tus comentarios"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchComments();
  }, []);

  function handleOpenDetail(incidentId: string) {
    setSelectedIncidentId(incidentId);
    setIsDetailDialogOpen(true);
  }

  async function handleDeleteComment() {
    if (!commentToDelete) return;

    const commentId = commentToDelete.commentId;

    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.add(commentId);
      return next;
    });

    try {
      await incidentsService.deleteCommentReport(commentId);

      setComments((prev) =>
        prev.filter((comment) => comment.commentId !== commentId)
      );

      setCommentToDelete(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar el comentario"
      );
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 text-muted-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>

        <h1 className="text-xl font-semibold tracking-tight">
          Mis comentarios
        </h1>

        <p className="text-sm text-muted-foreground mt-0.5">
          Comentarios que hiciste en incidentes de otros usuarios
        </p>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {loading && (
          <div className="divide-y divide-border px-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <CommentCardSkeleton key={index} />
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

        {!loading && !error && comments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
            <FileX className="h-8 w-8 text-muted-foreground/40" />

            <div>
              <p className="text-sm font-medium">Sin comentarios</p>
              <p className="text-xs text-muted-foreground mt-1">
                Todavía no comentaste incidentes de otros usuarios.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && comments.length > 0 && (
          <div className="px-2 divide-y divide-border">
            {comments.map((comment) => (
              <CommentCard
                key={comment.commentId}
                comment={comment}
                onViewDetail={() => handleOpenDetail(comment.incidentId)}
                onAskDelete={() => setCommentToDelete(comment)}
                isDeleting={deletingIds.has(comment.commentId)}
              />
            ))}
          </div>
        )}
      </div>

      {!loading && !error && comments.length > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          {comments.length}{" "}
          {comments.length === 1 ? "comentario" : "comentarios"} en total
        </p>
      )}

      <IncidentDetailDialog
        incidentId={selectedIncidentId}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />

      <AlertDialog
        open={Boolean(commentToDelete)}
        onOpenChange={(open) => {
          if (!open) setCommentToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este comentario?</AlertDialogTitle>

            <AlertDialogDescription>
              Esta acción cambiará el estado del comentario y dejará de estar
              visible. No hay vuelta atrás una vez confirmado.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {commentToDelete && (
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground mb-1">
                Comentario:
              </p>

              <p className="text-sm leading-relaxed line-clamp-4">
                {commentToDelete.comment}
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(commentToDelete && deletingIds.has(commentToDelete.commentId))}>
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={Boolean(commentToDelete && deletingIds.has(commentToDelete.commentId))}
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteComment();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {commentToDelete && deletingIds.has(commentToDelete.commentId)
                ? "Eliminando..."
                : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}