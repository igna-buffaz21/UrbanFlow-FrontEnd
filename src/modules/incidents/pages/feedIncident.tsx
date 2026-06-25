import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  MessageCircle,
  Flag,
  Clock,
  ImageOff,
} from "lucide-react";

import { incidentsService } from "../incidents.service";
import type { IncidentFeedItem, GetIncidentFeedParams } from "../incidents.type";

import { IncidentCommentsDialog } from "@/components/dialog-comments-incident";

type Incident = IncidentFeedItem;

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open: {
    label: "Abierto",
    className: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  },
  in_review: {
    label: "En revisión",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  },
  resolved: {
    label: "Resuelto",
    className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  road_damage: "Baches y calzada",
  fallen_trees: "Árboles y ramas caídas",
  street_lighting: "Alumbrado público",
  traffic_signals: "Semáforos y señalización",
  waste_management: "Residuos y limpieza urbana",
  sidewalks: "Veredas y espacios peatonales",
  water_and_sewer: "Agua y cloacas",
  animals: "Animales en la vía pública",
  vandalism: "Vandalismo y daños",
  green_spaces: "Espacios verdes",
  noise_complaints: "Ruido o molestias",
  other: "Otros",
};

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

interface ActionButtonsProps {
  incident: Incident;
  onCommentsOpen: () => void;
  onCommentsCountChange: (count: number) => void;
}

function ActionButtons({ incident, onCommentsOpen}: ActionButtonsProps) {
  const [reported, setReported] = useState(false);
  const [reportsCount, setReportsCount] = useState(incident.reportsCount ?? 0);
  const [commentsCount, setCommentsCount] = useState(incident.commentsCount ?? 0);
  const [reportLoading, setReportLoading] = useState(false);

  // Fetch real report state on mount
  useEffect(() => {
    incidentsService.getIncidentReport(incident.id)
      .then((data) => {
        setReported(data.reportedByMe);
        setReportsCount(data.reportsCount);
      })
      .catch(() => {
        // silently fail — keep defaults
      });
  }, [incident.id]);

  // Sync commentsCount if parent updates
  useEffect(() => {
    setCommentsCount(incident.commentsCount ?? 0);
  }, [incident.commentsCount]);

  const handleReport = async () => {
    if (reportLoading) return;
    setReportLoading(true);

    const wasReported = reported;
    // Optimistic update
    setReported(!wasReported);
    setReportsCount((c) => (wasReported ? c - 1 : c + 1));

    try {
      if (wasReported) {
        await incidentsService.deleteIncidentReport(incident.id);
      } else {
        await incidentsService.addIncidentReport(incident.id);
      }
    } catch {
      // Revert on error
      setReported(wasReported);
      setReportsCount((c) => (wasReported ? c + 1 : c - 1));
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Botón reportar */}
      <button
        type="button"
        onClick={handleReport}
        disabled={reportLoading}
        className="flex flex-col items-center gap-1.5 transition-transform active:scale-90 disabled:opacity-60"
        aria-label={reported ? "Quitar reporte" : "Reportar incidente"}
        aria-pressed={reported}
      >
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
            reported
              ? "bg-red-500 text-white shadow-lg shadow-red-500/40"
              : "bg-black/40 text-white backdrop-blur-sm"
          }`}
        >
          <Flag
            className={`h-5 w-5 transition-all ${reported ? "fill-white" : ""}`}
          />
        </div>
        <span className="text-xs font-medium text-white drop-shadow-sm">
          {reportsCount}
        </span>
      </button>

      {/* Botón comentarios */}
      <button
        type="button"
        onClick={onCommentsOpen}
        className="flex flex-col items-center gap-1.5 transition-transform active:scale-90"
        aria-label="Ver comentarios"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
          <MessageCircle className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-white drop-shadow-sm">
          {commentsCount}
        </span>
      </button>
    </div>
  );
}

interface IncidentCardProps {
  incident: Incident;
  isActive: boolean;
}

function IncidentCard({ incident, isActive }: IncidentCardProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(incident.commentsCount ?? 0);

  const status = STATUS_CONFIG[incident.status] ?? {
    label: incident.status,
    className: "",
  };

  const category = CATEGORY_LABELS[incident.category?.name] ?? incident.category?.name;
  const isUrgent = (incident.aiUrgencyScore ?? 0) >= 4;
  const hasPhoto = Boolean(incident.photoUrl);

  return (
    <>
      <section
        data-incident-id={incident.id}
        className="incident-snap-item relative flex h-full w-full snap-start snap-always flex-col overflow-hidden"
        aria-label={incident.title}
      >
        {/* Capa de fondo */}
        <div className="absolute inset-0 overflow-hidden bg-black">
          {hasPhoto ? (
            <>
              <img
                src={incident.photoUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl"
                loading={isActive ? "eager" : "lazy"}
              />
              <img
                src={incident.photoUrl}
                alt={incident.title}
                className="absolute inset-0 h-full w-full object-contain"
                loading={isActive ? "eager" : "lazy"}
              />
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-muted to-muted/70">
              <ImageOff className="h-10 w-10 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground/70">
                Sin foto disponible
              </span>
            </div>
          )}

          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex flex-row items-center gap-2.5 px-4 pt-4">
          <Avatar className="h-9 w-9 border border-white/40">
            <AvatarImage
              src={incident.createdBy?.photoUrl ?? undefined}
              alt={incident.createdBy?.name ?? undefined}
            />
            <AvatarFallback className="text-xs">
              {incident.createdBy?.name?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium leading-tight text-white drop-shadow-sm">
              {incident.createdBy?.name ?? "Usuario"}
            </span>
            <span className="flex items-center gap-1 text-xs text-white/80">
              <Clock className="h-3 w-3" />
              {timeAgo(incident.createdAt)}
            </span>
          </div>

          <Badge
            variant="secondary"
            className={`ml-auto shrink-0 px-2 py-0 text-[11px] ${status.className}`}
          >
            {status.label}
          </Badge>
        </div>

        <div className="flex-1" />

        {/* Fila inferior: contenido + botones de acción */}
        <div className="relative z-10 flex flex-row items-end gap-3 px-4 pb-5">
          {/* Texto izquierdo */}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-base font-semibold leading-tight text-white drop-shadow-sm">
                {incident.title}
              </h3>

              {isUrgent && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[11px] font-medium text-white">
                  <AlertTriangle className="h-3 w-3" />
                  Urgente
                </span>
              )}
            </div>

            {incident.description && (
              <p className="line-clamp-2 text-sm leading-relaxed text-white/85">
                {incident.description}
              </p>
            )}

            {category && (
              <Badge
                variant="outline"
                className="w-fit border-white/30 bg-black/30 text-[11px] font-normal text-white"
              >
                {category}
              </Badge>
            )}
          </div>

          {/* Botones de acción — barra lateral derecha estilo TikTok */}
          <div className="shrink-0 pb-1">
            <ActionButtons
              incident={{ ...incident, commentsCount: localCommentsCount }}
              onCommentsOpen={() => setCommentsOpen(true)}
              onCommentsCountChange={setLocalCommentsCount}
            />
          </div>
        </div>
      </section>

      <IncidentCommentsDialog
        incidentId={incident.id}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        onCommentsCountChange={(_id, count) => setLocalCommentsCount(count)}
      />
    </>
  );
}

function FeedInitialSkeleton() {
  return (
    <div className="relative flex h-full w-full shrink-0 snap-start snap-always flex-col overflow-hidden bg-black">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-zinc-900 via-zinc-950 to-black" />

      <div className="relative z-10 flex flex-row items-center gap-2.5 px-4 pt-4">
        <Skeleton className="h-9 w-9 rounded-full bg-white/15" />

        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24 bg-white/15" />
          <Skeleton className="h-2.5 w-12 bg-white/10" />
        </div>

        <Skeleton className="ml-auto h-5 w-20 rounded-full bg-white/15" />
      </div>

      <div className="flex-1" />

      <div className="relative z-10 flex flex-row items-end gap-3 px-4 pb-5">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <Skeleton className="h-5 w-2/3 bg-white/15" />
          <Skeleton className="h-3.5 w-full bg-white/10" />
          <Skeleton className="h-3.5 w-3/4 bg-white/10" />
          <Skeleton className="h-5 w-24 rounded-full bg-white/15" />
        </div>

        <div className="flex shrink-0 flex-col items-center gap-5 pb-1">
          <div className="flex flex-col items-center gap-1.5">
            <Skeleton className="h-12 w-12 rounded-full bg-white/15" />
            <Skeleton className="h-3 w-5 bg-white/10" />
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <Skeleton className="h-12 w-12 rounded-full bg-white/15" />
            <Skeleton className="h-3 w-5 bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingMoreSkeleton() {
  return (
    <div className="flex h-24 w-full items-center justify-center bg-black">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  );
}

interface IncidentFeedProps {
  limit?: number;
  initialCoords?: { lat: number; lng: number };
}

export default function IncidentFeed({
  limit = 5,
  initialCoords,
}: IncidentFeedProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialCoords ?? null
  );

  const [locating, setLocating] = useState(!initialCoords);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [incidents, setIncidents] = useState<IncidentFeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const activeObserverRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationError("Tu navegador no soporta geolocalización");
      setLocating(false);
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Necesitamos tu ubicación para mostrarte los incidentes cercanos"
            : "No pudimos obtener tu ubicación"
        );
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (initialCoords) return;
    requestLocation();
  }, [initialCoords, requestLocation]);

  const loadPage = useCallback(
    async (pageToLoad: number) => {
      if (!coords || loadingRef.current) return;

      loadingRef.current = true;

      if (pageToLoad === 1) {
        setInitialLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      try {
        const params: GetIncidentFeedParams = {
          lat: coords.lat,
          lng: coords.lng,
          page: pageToLoad,
          limit,
        };

        const newItems = await incidentsService.getFeed(params);

        setIncidents((prev) => {
          const seen = new Set(prev.map((i) => i.id));

          return [
            ...prev,
            ...newItems.filter((item) => !seen.has(item.id)),
          ];
        });

        setHasMore(newItems.length === limit);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
        loadingRef.current = false;
      }
    },
    [coords, limit]
  );

  useEffect(() => {
    if (!coords) return;
    setIncidents([]);
    setHasMore(true);
    setPage(1);
    setActiveIndex(0);
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { root: containerRef.current, rootMargin: "600px" }
    );

    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, incidents.length]);

  useEffect(() => {
    if (page > 1) loadPage(page);
  }, [page, loadPage]);

  useEffect(() => {
    if (!containerRef.current) return;

    activeObserverRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          const id = (visible.target as HTMLElement).dataset.incidentId;
          const idx = incidents.findIndex((i) => i.id === id);
          if (idx !== -1) setActiveIndex(idx);
        }
      },
      { root: containerRef.current, threshold: [0.6] }
    );

    const items = containerRef.current.querySelectorAll(".incident-snap-item");
    items.forEach((el) => activeObserverRef.current?.observe(el));

    return () => activeObserverRef.current?.disconnect();
  }, [incidents]);

  if (locating) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Obteniendo tu ubicación...</p>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background px-4">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center text-sm text-destructive">
          {locationError}.{" "}
          <button
            type="button"
            onClick={requestLocation}
            className="underline underline-offset-2"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (initialLoading && incidents.length === 0) {
    return <FeedInitialSkeleton />;
  }

  if (!initialLoading && !error && incidents.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">
          No hay incidentes para mostrar todavía
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full snap-y snap-mandatory overflow-y-scroll scroll-smooth bg-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {incidents.map((incident, index) => (
        <div key={incident.id} className="h-full w-full snap-start">
          <IncidentCard incident={incident} isActive={index === activeIndex} />
        </div>
      ))}

      {loadingMore && <LoadingMoreSkeleton />}

      {error && (
        <div className="flex h-full w-full items-center justify-center bg-background px-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center text-sm text-destructive">
            {error}.{" "}
            <button
              type="button"
              onClick={() => loadPage(page)}
              className="underline underline-offset-2"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {!hasMore && !loadingMore && incidents.length > 0 && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-background px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Ya viste todos los incidentes
          </p>
        </div>
      )}

      <div ref={sentinelRef} className="h-1 w-full" />

      {incidents.length > 1 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 flex justify-center gap-1.5 md:hidden">
          {incidents.slice(0, 8).map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === activeIndex ? "w-4 bg-white" : "w-1 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}