"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  useMap,
} from "@/components/ui/map";
import { AlertTriangle, Camera, ChevronLeft, ChevronRight, Loader2, MapPin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { incidentsService } from "@/modules/incidents/incidents.service";
import { notify } from "@/lib/notify";
import type { AdminIncidentDetail } from "@/modules/incidents/incidents.type";

// ─── Types ────────────────────────────────────────────────────────────────────

type MapCenter = [number, number]; // [lng, lat]

type CreateIncidentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultLocation: MapCenter | null;
  onCreated?: () => void;
};

type CreateIncidentLocation = {
  type: "Point";
  coordinates: MapCenter;
};

type IncidentStatus =
  | "open"
  | "in_review"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "rejected";

type IncidentPriority = "low" | "medium" | "high" | "critical";

type IncidentCreatedBy = {
  id: string;
  name: string;
  photoUrl: string | null;
};

export interface IncidentDetail {
  id: string;
  title: string;
  description: string;
  photoUrl: string | null;
  category: string | null;
  status: IncidentStatus;
  priority: IncidentPriority;
  createdAt: string;
  createdBy: IncidentCreatedBy;
  is_owner: boolean;
}

type CreateIncidentResponse =
  | { status: "created"; message: string; data: unknown }
  | {
      status: "rejected";
      message: string;
      data: { rejectionReason: string | null; reasons: string[] };
    }
  | {
      status: "possible_duplicate";
      message: string;
      data: {
        pendingIncidentId: string;
        duplicateOfIncidentId: string;
        duplicateConfidence: number;
        duplicateReason: string | null;
      };
    };

type AiRejectedState = {
  rejectionReason: string | null;
  reasons: string[];
};

type PossibleDuplicateState = {
  duplicateOfIncidentId: string;
  duplicateConfidence: number;
  duplicateReason: string | null;
};

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/octet-stream",
];

const ACCEPTED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
];

// ─── Map click + locate handler ───────────────────────────────────────────────

function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (coords: MapCenter) => void;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    // Click to place marker
    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      onLocationSelect([lng, lat]);
    };

    // "Locate me" button — move marker to current GPS position
    const handleLocate = (e: { coords: GeolocationCoordinates }) => {
      onLocationSelect([e.coords.longitude, e.coords.latitude]);
    };

    map.on("click", handleClick);
    map.on("geolocate", handleLocate);

    return () => {
      map.off("click", handleClick);
      map.off("geolocate", handleLocate);
    };
  }, [map, isLoaded, onLocationSelect]);

  return null;
}

// ─── Step bar ─────────────────────────────────────────────────────────────────

function StepBar({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-px flex-1 bg-border">
        <div
          className="absolute inset-y-0 left-0 bg-foreground transition-all duration-300"
          style={{ width: step === 1 ? "50%" : "100%" }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{step} / 2</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CreateIncidentDialog({
  open,
  onOpenChange,
  defaultLocation,
  onCreated,
}: CreateIncidentDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<MapCenter | null>(defaultLocation);
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDuplicate, setIsLoadingDuplicate] = useState(false);
  const [isResolvingDuplicate, setIsResolvingDuplicate] = useState(false);
  const [pendingIncidentId, setPendingIncidentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aiRejected, setAiRejected] = useState<AiRejectedState | null>(null);
  const [possibleDuplicate, setPossibleDuplicate] = useState<PossibleDuplicateState | null>(null);
  const [duplicateIncident, setDuplicateIncident] = useState<AdminIncidentDetail | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  // Stable callback ref so MapClickHandler doesn't re-register on every render
  const onLocationSelectRef = useRef<(coords: MapCenter) => void>(() => {});
  onLocationSelectRef.current = (coords: MapCenter) => {
    setSelectedLocation(coords);
    clearAiMessages();
  };
  const stableOnLocationSelect = useMemo(
    () => (coords: MapCenter) => onLocationSelectRef.current(coords),
    []
  );

  useEffect(() => {
    if (!open) return;
    if (defaultLocation) setSelectedLocation(defaultLocation);
  }, [open, defaultLocation]);

  const imagePreviewUrl = useMemo(() => {
    if (!image) return null;
    return URL.createObjectURL(image);
  }, [image]);

  useEffect(() => {
    return () => { if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); };
  }, [imagePreviewUrl]);

  const step1Valid = Boolean(selectedLocation);

  const isValid = Boolean(
    title.trim() &&
    description.trim() &&
    selectedLocation &&
    image &&
    isAcceptedImage(image)
  );

  function clearAiMessages() {
    setAiRejected(null);
    setPossibleDuplicate(null);
    setDuplicateIncident(null);
    setDuplicateDialogOpen(false);
  }

  async function buildFormData(params?: { ignoreDuplicateCheck?: boolean }) {
    if (!selectedLocation || !image) return null;

    // 👇 debug temporal: probar si el File sigue siendo legible
    try {
      const buf = await image.slice(0, 1).arrayBuffer();
      console.log("imagen legible, bytes leídos:", buf.byteLength, "size total:", image.size);
    } catch (e) {
      console.error("⚠️ el File ya no es legible:", e);
      alert("EL ARCHIVO SE INVALIDÓ: " + e);
    }

    const location: CreateIncidentLocation = { type: "Point", coordinates: selectedLocation };
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("location", JSON.stringify(location));
    formData.append("image", image);
    if (params?.ignoreDuplicateCheck) formData.append("ignoreDuplicateCheck", "true");
    return formData;
  }

  function isAcceptedImage(file: File): boolean {
    const fileName = file.name.toLowerCase();

    const hasValidMimeType =
      file.type === "" || ACCEPTED_IMAGE_TYPES.includes(file.type);

    const hasValidExtension = ACCEPTED_IMAGE_EXTENSIONS.some((extension) =>
      fileName.endsWith(extension)
    );

    return hasValidMimeType || hasValidExtension;
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      alert("No se seleccionó ningún archivo");
      setImage(null);
      return;
    }

    alert(`
  Archivo seleccionado:

  Nombre: ${file.name}
  Tipo: ${file.type || "SIN TYPE"}
  Peso: ${(file.size / 1024 / 1024).toFixed(2)} MB
  Última modificación: ${new Date(file.lastModified).toLocaleString()}
  `);

    if (!isAcceptedImage(file)) {
      alert(`
  Imagen rechazada por validación del frontend.

  Nombre: ${file.name}
  Tipo: ${file.type || "SIN TYPE"}
  Peso: ${(file.size / 1024 / 1024).toFixed(2)} MB
  `);

      setImage(null);
      setErrorMessage("La imagen debe ser JPG, PNG, WEBP, HEIC o HEIF.");
      clearAiMessages();
      return;
    }

    alert("Imagen aceptada por el frontend");

    setErrorMessage(null);
    clearAiMessages();
    setImage(file);
  }

  function resetForm() {
    setStep(1);
    setTitle("");
    setDescription("");
    setSelectedLocation(defaultLocation);
    setImage(null);
    setErrorMessage(null);
    setAiRejected(null);
    setPossibleDuplicate(null);
    setDuplicateIncident(null);
    setDuplicateDialogOpen(false);
  }

  function handleCreated(message?: string) {
    resetForm();
    onOpenChange(false);
    onCreated?.();
    notify.success(message || "Se creó el incidente correctamente.");
  }

  async function handlePossibleDuplicate(
    response: Extract<CreateIncidentResponse, { status: "possible_duplicate" }>
  ) {
    const duplicateOfIncidentId = response.data.duplicateOfIncidentId;
    if (!duplicateOfIncidentId) {
      setErrorMessage("La IA detectó un duplicado, pero no devolvió el ID del incidente.");
      return;
    }
    setPossibleDuplicate({
      duplicateOfIncidentId,
      duplicateConfidence: response.data.duplicateConfidence,
      duplicateReason: response.data.duplicateReason,
    });
    try {
      setIsLoadingDuplicate(true);
      const incident = await incidentsService.getIncidentById(duplicateOfIncidentId);
      setDuplicateIncident(incident);
      setDuplicateDialogOpen(true);
      setPendingIncidentId(response.data.pendingIncidentId);
    } catch (error) {
      console.error(error);
      setErrorMessage("Se detectó un posible duplicado, pero no se pudo cargar el incidente.");
      notify.error("No se pudo cargar el posible incidente duplicado.");
    } finally {
      setIsLoadingDuplicate(false);
    }
  }

  async function submitCreate(params?: { ignoreDuplicateCheck?: boolean }) {
    const formData = await buildFormData(params);
    if (!formData) return;
    const response = (await incidentsService.createIncident(formData)) as CreateIncidentResponse;
    if (response.status === "created") { handleCreated(response.message); return; }
    if (response.status === "rejected") {
      setAiRejected({ rejectionReason: response.data.rejectionReason, reasons: response.data.reasons });
      notify.error(response.message || "El incidente fue rechazado por la IA.");
      return;
    }
    if (response.status === "possible_duplicate") { await handlePossibleDuplicate(response); return; }
    setErrorMessage("Respuesta inesperada del servidor.");
  }

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      clearAiMessages();
      await submitCreate();
    } catch (error: any) {
      console.error(error);
      alert(`
  CODE: ${error?.code}
  MESSAGE: ${error?.message}
  STATUS: ${error?.response?.status}
  TIMEOUT CONFIG: ${error?.config?.timeout}
  ONLINE: ${navigator.onLine}
      `);
      setErrorMessage("No se pudo reportar el incidente.");
      notify.error("No se pudo reportar el incidente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmSameIncident() {
    if (!pendingIncidentId) { notify.error("No se encontró el incidente pendiente."); return; }
    try {
      setIsResolvingDuplicate(true);
      await incidentsService.resolvePendingDuplicate(pendingIncidentId, "confirm_duplicate");
      setDuplicateDialogOpen(false);
      resetForm();
      onOpenChange(false);
      onCreated?.();
      notify.success("Se sumó tu reporte al incidente existente.");
    } catch (error) {
      console.error(error);
      notify.error("No se pudo sumar el reporte al incidente existente.");
    } finally {
      setIsResolvingDuplicate(false);
    }
  }

  async function handleConfirmDifferentIncident() {
    if (!pendingIncidentId) { notify.error("No se encontró el incidente pendiente."); return; }
    try {
      setIsResolvingDuplicate(true);
      await incidentsService.resolvePendingDuplicate(pendingIncidentId, "create_new");
      setDuplicateDialogOpen(false);
      resetForm();
      onOpenChange(false);
      onCreated?.();
      notify.success("Se creó el incidente correctamente.");
    } catch (error) {
      console.error(error);
      notify.error("No se pudo crear el incidente.");
    } finally {
      setIsResolvingDuplicate(false);
    }
  }

  function handleOpenChange(value: boolean) {
    onOpenChange(value);
    if (!value) resetForm();
  }

  return (
    <>
      {/* ── Main dialog ──────────────────────────────────────────────────── */}
      {/* hideCloseButton removes the default X so there's only one close button */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[92dvh] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:rounded-xl"
        >

          {/* Header — single close button lives here */}
          <div className="flex shrink-0 flex-col gap-3 px-4 py-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {step === 1 ? "Paso 1 de 2" : "Paso 2 de 2"}
                </p>
                <DialogTitle className="mt-0.5 text-lg font-semibold">
                  {step === 1 ? "¿Dónde ocurrió?" : "Contanos qué pasó"}
                </DialogTitle>
              </div>
              {/* Single X button */}
              <button
                onClick={() => handleOpenChange(false)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                aria-label="Cerrar"
              >
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
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <StepBar step={step} />
          </div>

          {/* Body */}
          <div className="flex min-h-0 flex-1 flex-col">

            {/* ── STEP 1: Map ── */}
            {step === 1 && (
              <>
                <div className="flex-1">
                  <Map
                    center={selectedLocation ?? defaultLocation ?? [0, 0]}
                    zoom={15}
                    className="h-full w-full"
                  >
                    {/*
                      MapClickHandler now also listens to the "geolocate" event
                      emitted by MapLibre's GeolocateControl, so clicking the
                      locate button moves the pin to the user's GPS position.
                    */}
                    <MapClickHandler onLocationSelect={stableOnLocationSelect} />

                    {selectedLocation && (
                      <MapMarker
                        longitude={selectedLocation[0]}
                        latitude={selectedLocation[1]}
                      >
                        <MarkerContent>
                          <MapPin
                            className="fill-foreground stroke-background"
                            size={32}
                          />
                        </MarkerContent>
                      </MapMarker>
                    )}

                    <MapControls
                      position="top-right"
                      showZoom
                      showLocate
                    />
                  </Map>
                </div>

                <div className="shrink-0 border-t px-4 py-3">
                  {selectedLocation ? (
                    <p className="font-mono text-xs text-muted-foreground">
                      {selectedLocation[1].toFixed(6)}, {selectedLocation[0].toFixed(6)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Tocá el mapa para marcar la ubicación.
                    </p>
                  )}
                  {errorMessage && (
                    <p className="mt-1 text-xs text-destructive">{errorMessage}</p>
                  )}
                </div>
              </>
            )}

            {/* ── STEP 2: Details ── */}
            {step === 2 && (
              <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Ej: Bache profundo en la calle"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); clearAiMessages(); }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Describí brevemente qué ocurrió o cuál es el problema."
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); clearAiMessages(); }}
                    className="min-h-[100px] resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Foto del incidente</Label>
                  {imagePreviewUrl ? (
                    <div className="group relative overflow-hidden rounded-lg border">
                      <img
                        src={imagePreviewUrl}
                        alt="Vista previa"
                        className="max-h-52 w-full object-cover"
                      />
                      <label
                        htmlFor="image-replace"
                        className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1.5 bg-background/70 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Camera className="size-5" />
                        <span className="text-xs font-medium">Cambiar foto</span>
                        <input
                          id="image-replace"
                          type="file"
                          className="sr-only"
                          accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif"
                          onChange={handleImageChange}
                        />
                      </label>
                    </div>
                  ) : (
                    <label
                      htmlFor="image"
                      className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed transition-colors hover:bg-muted/50"
                    >
                      <Camera className="size-5 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm">Subir foto</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, HEIC o HEIF</p>
                      </div>
                      <input
                        id="image"
                        type="file"
                        className="sr-only"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif"                        
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>

                {isLoadingDuplicate && (
                  <p className="text-xs text-muted-foreground">Verificando posibles duplicados...</p>
                )}

                {aiRejected && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm">
                    <p className="font-medium text-destructive">Incidente rechazado</p>
                    {aiRejected.rejectionReason && (
                      <p className="mt-1 text-destructive/80">{aiRejected.rejectionReason}</p>
                    )}
                    {aiRejected.reasons.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-destructive/80">
                        {aiRejected.reasons.map((r, i) => <li key={`${r}-${i}`}>{r}</li>)}
                      </ul>
                    )}
                  </div>
                )}

                {errorMessage && (
                  <p className="text-xs text-destructive">{errorMessage}</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t px-4 py-3">
            {step === 1 ? (
              <Button
                size="lg"
                className="w-full"
                onClick={() => setStep(2)}
                disabled={!step1Valid}
              >
                Continuar
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              /* Buttons stacked vertically, full width, size lg */
              <div className="flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={!isValid || isSubmitting || isResolvingDuplicate}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="size-4" />
                      Reportar incidente
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => { setStep(1); setErrorMessage(null); clearAiMessages(); }}
                  disabled={isSubmitting || isResolvingDuplicate}
                >
                  <ChevronLeft className="size-4" />
                  Volver
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Duplicate dialog ─────────────────────────────────────────────── */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className="max-w-sm p-0 sm:rounded-xl">
          <div className="px-4 py-4">
            <DialogTitle className="text-base">Posible duplicado</DialogTitle>
          </div>

          <div className="space-y-4 px-4 pb-4">
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">La IA encontró un reporte parecido</p>
              {possibleDuplicate?.duplicateReason && (
                <p className="mt-1 text-muted-foreground">{possibleDuplicate.duplicateReason}</p>
              )}
              {possibleDuplicate && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Confianza: {Math.round(possibleDuplicate.duplicateConfidence * 100)}%
                </p>
              )}
            </div>

            {duplicateIncident ? (
              <div className="overflow-hidden rounded-lg border">
                {duplicateIncident.photoUrl && (
                  <img
                    src={duplicateIncident.photoUrl}
                    alt={duplicateIncident.title}
                    className="max-h-40 w-full object-cover"
                  />
                )}
                <div className="space-y-1.5 p-3">
                  <p className="font-medium leading-tight">{duplicateIncident.title}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{duplicateIncident.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">{duplicateIncident.status}</span>
                    <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">{duplicateIncident.priority}</span>
                    {duplicateIncident.category && (
                      <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">{duplicateIncident.category.name}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Reportado por {duplicateIncident.createdBy.name}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Cargando reporte...</p>
            )}

            <p className="text-sm text-muted-foreground">¿Es el mismo problema que querés reportar?</p>
          </div>

          <div className="flex flex-col gap-2 border-t px-4 py-3">
            <Button
              size="lg"
              onClick={handleConfirmSameIncident}
              disabled={isResolvingDuplicate || !duplicateIncident}
              className="w-full"
            >
              {isResolvingDuplicate ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Sí, sumar mi reporte"
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleConfirmDifferentIncident}
              disabled={isResolvingDuplicate || !duplicateIncident}
              className="w-full"
            >
              No, crear uno nuevo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}