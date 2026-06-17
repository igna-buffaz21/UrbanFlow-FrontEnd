import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

import { incidentsService } from "@/modules/incidents/incidents.service";
import type { IncidentCommentResponse } from "@/modules/incidents/incidents.type";

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "ahora";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;

  return `${Math.floor(days / 30)}mes`;
}

interface CommentItemProps {
  comment: IncidentCommentResponse;
}

function CommentItem({ comment }: CommentItemProps) {
  return (
    <div className="flex gap-2.5 py-2.5">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage
          src={comment.createdBy?.photoUrl ?? undefined}
          alt={comment.createdBy?.name ?? undefined}
        />
        <AvatarFallback className="text-xs">
          {comment.createdBy?.name?.[0] ?? "?"}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium leading-tight">
            {comment.createdBy?.name ?? "Usuario"}
          </span>
          <span className="text-xs text-muted-foreground">
            {timeAgo(comment.createdAt)}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-foreground/90">
          {comment.comment}
        </p>

        {comment.photoUrl && (
          <img
            src={comment.photoUrl}
            alt=""
            className="mt-1.5 h-32 w-32 rounded-md object-cover"
            loading="lazy"
          />
        )}
      </div>
    </div>
  );
}

function CommentSkeleton() {
  return (
    <div className="flex gap-2.5 py-2.5">
      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
    </div>
  );
}

interface IncidentCommentsDialogProps {
  incidentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Notifica al padre cuánto cambió el conteo, para reflejarlo en la card del feed sin refetch */
  onCommentsCountChange?: (incidentId: string, count: number) => void;
}

export function IncidentCommentsDialog({
  incidentId,
  open,
  onOpenChange,
  onCommentsCountChange,
}: IncidentCommentsDialogProps) {
  const [comments, setComments] = useState<IncidentCommentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const listEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !incidentId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    incidentsService
      .getIncidentComments(incidentId)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "No pudimos cargar los comentarios"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, incidentId]);

  // Al cerrar, limpiamos el estado para que el próximo incidente abra limpio
  useEffect(() => {
    if (!open) {
      setComments([]);
      setDraft("");
      setError(null);
    }
  }, [open]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !incidentId || sending) return;

    setSending(true);

    try {
      const created = await incidentsService.addCommentReport(
        incidentId,
        text
      );

      setComments((prev) => {
        const next = [...prev, created];
        onCommentsCountChange?.(incidentId, next.length);
        return next;
      });

      setDraft("");

      requestAnimationFrame(() => {
        listEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos enviar tu comentario"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[80vh] max-h-[640px] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="text-base">Comentarios</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {loading && (
            <div className="divide-y">
              {Array.from({ length: 4 }).map((_, i) => (
                <CommentSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && comments.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
              <p className="text-sm text-muted-foreground">
                Todavía no hay comentarios
              </p>
              <p className="text-xs text-muted-foreground/70">
                Sé el primero en comentar
              </p>
            </div>
          )}

          {!loading && !error && comments.length > 0 && (
            <div className="divide-y">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
              <div ref={listEndRef} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t px-3 py-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escribí un comentario..."
            disabled={sending}
            className="h-9 flex-1 rounded-full border border-input bg-background px-3.5 text-sm outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
          />

          <Button
            type="button"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full"
            disabled={!draft.trim() || sending}
            onClick={handleSend}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}