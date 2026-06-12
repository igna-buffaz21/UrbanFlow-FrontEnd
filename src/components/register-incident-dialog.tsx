import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, ImageIcon, LocateFixed, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  IncidentLocationPickerMap,
  type MapCenter,
} from "./incident-picker";
import { incidentsService } from "@/modules/incidents/incidents.service";
import { notify } from "@/lib/notify";
import type { AdminIncidentDetail } from "@/modules/incidents/incidents.type";

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
  | {
      status: "created";
      message: string;
      data: unknown;
    }
  | {
      status: "rejected";
      message: string;
      data: {
        rejectionReason: string | null;
        reasons: string[];
      };
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
];

export function CreateIncidentDialog({
  open,
  onOpenChange,
  defaultLocation,
  onCreated,
}: CreateIncidentDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [selectedLocation, setSelectedLocation] = useState<MapCenter | null>(
    defaultLocation
  );

  const [image, setImage] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDuplicate, setIsLoadingDuplicate] = useState(false);
  const [isResolvingDuplicate, setIsResolvingDuplicate] = useState(false);

  const [pendingIncidentId, setPendingIncidentId] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aiRejected, setAiRejected] = useState<AiRejectedState | null>(null);

  const [possibleDuplicate, setPossibleDuplicate] =
    useState<PossibleDuplicateState | null>(null);

  const [duplicateIncident, setDuplicateIncident] =
    useState<AdminIncidentDetail | null>(null);

  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (defaultLocation) {
      setSelectedLocation(defaultLocation);
    }
  }, [open, defaultLocation]);

  const imagePreviewUrl = useMemo(() => {
    if (!image) return null;

    return URL.createObjectURL(image);
  }, [image]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const isValid = Boolean(
    title.trim() &&
      description.trim() &&
      selectedLocation &&
      image &&
      ACCEPTED_IMAGE_TYPES.includes(image.type)
  );

  function clearAiMessages() {
    setAiRejected(null);
    setPossibleDuplicate(null);
    setDuplicateIncident(null);
    setDuplicateDialogOpen(false);
  }

  function buildFormData(params?: { ignoreDuplicateCheck?: boolean }) {
    if (!selectedLocation || !image) return null;

    const location: CreateIncidentLocation = {
      type: "Point",
      coordinates: selectedLocation,
    };

    const formData = new FormData();

    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("location", JSON.stringify(location));
    formData.append("image", image);

    /**
     * Importante:
     * Este campo necesita existir en tu backend.
     * La idea es que cuando el usuario diga "No, no es el mismo incidente",
     * el backend cree el incidente sin volver a frenarlo por duplicado.
     */
    if (params?.ignoreDuplicateCheck) {
      formData.append("ignoreDuplicateCheck", "true");
    }

    return formData;
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setImage(null);
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImage(null);
      setErrorMessage("La imagen debe ser JPG, PNG, WEBP, HEIC o HEIF.");
      clearAiMessages();
      return;
    }

    setErrorMessage(null);
    clearAiMessages();
    setImage(file);
  }

  function handleUseCurrentLocation() {
    if (!defaultLocation) {
      setErrorMessage("No se pudo obtener tu ubicación actual.");
      return;
    }

    setSelectedLocation(defaultLocation);
    setErrorMessage(null);
    clearAiMessages();
  }

  function resetForm() {
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

  async function handlePossibleDuplicate(response: Extract<CreateIncidentResponse, { status: "possible_duplicate" }>) {
    const duplicateOfIncidentId = response.data.duplicateOfIncidentId;

    if (!duplicateOfIncidentId) {
      setErrorMessage("La IA detectó un duplicado, pero no devolvió el ID del incidente.");
      return;
    }

    const duplicateData: PossibleDuplicateState = {
      duplicateOfIncidentId,
      duplicateConfidence: response.data.duplicateConfidence,
      duplicateReason: response.data.duplicateReason,
    };

    setPossibleDuplicate(duplicateData);

    try {
      setIsLoadingDuplicate(true);
      const incident = await incidentsService.getIncidentById(
        duplicateOfIncidentId
      );

      setDuplicateIncident(incident);
      setDuplicateDialogOpen(true);

      setPendingIncidentId(response.data.pendingIncidentId)

      console.log("ID DEL NUEVO PENDING:" + response.data.pendingIncidentId)
      console.log("ID DEL INCIDENTE ORIGINAL:" + response.data.duplicateOfIncidentId)
      
    } catch (error) {
      console.error(error);
      setErrorMessage("Se detectó un posible duplicado, pero no se pudo cargar el incidente.");
      notify.error("No se pudo cargar el posible incidente duplicado.");
    } finally {
      setIsLoadingDuplicate(false);
    }
  }

  async function submitCreate(params?: { ignoreDuplicateCheck?: boolean }) {
    const formData = buildFormData(params);

    if (!formData) return;

    const response = (await incidentsService.createIncident(
      formData
    )) as CreateIncidentResponse;

    if (response.status === "created") {
      handleCreated(response.message);
      return;
    }

    if (response.status === "rejected") {
      setAiRejected({
        rejectionReason: response.data.rejectionReason,
        reasons: response.data.reasons,
      });

      notify.error(response.message || "El incidente fue rechazado por la IA.");
      return;
    }

    if (response.status === "possible_duplicate") {
      await handlePossibleDuplicate(response);
      return;
    }

    setErrorMessage("Respuesta inesperada del servidor.");
  }

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      clearAiMessages();

      await submitCreate();
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo reportar el incidente.");
      notify.error("No se pudo reportar el incidente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmSameIncident() {
    if (!pendingIncidentId) {
      notify.error("No se encontró el incidente pendiente.");
      return;
    }

    try {
      setIsResolvingDuplicate(true);

      await incidentsService.resolvePendingDuplicate(
        pendingIncidentId,
        "confirm_duplicate"
      );

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
    if (!pendingIncidentId) {
      notify.error("No se encontró el incidente pendiente.");
      return;
    }

    try {
      setIsResolvingDuplicate(true);

      await incidentsService.resolvePendingDuplicate(
        pendingIncidentId,
        "create_new"
      );

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

    if (!value) {
      resetForm();
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reportar incidente</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>

              <Input
                id="title"
                placeholder="Ej: Bache profundo en la calle"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  clearAiMessages();
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>

              <Textarea
                id="description"
                placeholder="Describí brevemente qué ocurrió o cuál es el problema."
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  clearAiMessages();
                }}
                className="min-h-24 resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label>Ubicación del incidente</Label>

                  <p className="text-xs text-muted-foreground">
                    Mové el marcador rojo hasta el punto exacto.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseCurrentLocation}
                  className="gap-2"
                >
                  <LocateFixed className="size-4" />
                  Mi ubicación
                </Button>
              </div>

              {selectedLocation ? (
                <>
                  <IncidentLocationPickerMap
                    value={selectedLocation}
                    onChange={(value) => {
                      setSelectedLocation(value);
                      clearAiMessages();
                    }}
                  />

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border px-2 py-1">
                      Lat: {selectedLocation[1].toFixed(6)}
                    </span>

                    <span className="rounded-full border px-2 py-1">
                      Lng: {selectedLocation[0].toFixed(6)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center">
                  <MapPin className="mb-2 size-6 text-muted-foreground" />

                  <p className="text-sm font-medium text-foreground">
                    No hay ubicación seleccionada
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Permití la ubicación o seleccioná una manualmente.
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="image">Imagen</Label>

              <Input
                id="image"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                onChange={handleImageChange}
              />

              <p className="text-xs text-muted-foreground">
                Formatos permitidos: JPG, PNG, WEBP, HEIC y HEIF.
              </p>

              {imagePreviewUrl ? (
                <div className="overflow-hidden rounded-xl border">
                  <img
                    src={imagePreviewUrl}
                    alt="Vista previa del incidente"
                    className="max-h-64 w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center">
                  <ImageIcon className="mb-2 size-6 text-muted-foreground" />

                  <p className="text-sm font-medium text-foreground">
                    Sin imagen seleccionada
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Subí una foto clara del incidente.
                  </p>
                </div>
              )}
            </div>

            {isLoadingDuplicate && (
              <div className="rounded-xl border p-3 text-sm text-muted-foreground">
                Cargando posible incidente duplicado...
              </div>
            )}

            {aiRejected && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <p className="font-medium">Incidente rechazado por la IA</p>

                {aiRejected.rejectionReason && (
                  <p className="mt-1">{aiRejected.rejectionReason}</p>
                )}

                {aiRejected.reasons.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {aiRejected.reasons.map((reason, index) => (
                      <li key={`${reason}-${index}`}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting || isResolvingDuplicate}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting || isResolvingDuplicate}
              className="gap-2"
            >
              <AlertTriangle className="size-4" />
              {isSubmitting ? "Reportando..." : "Reportar incidente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Posible incidente duplicado</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm">
              <p className="font-medium">
                La IA detectó que este incidente podría estar duplicado.
              </p>

              {possibleDuplicate?.duplicateReason && (
                <p className="mt-1 text-muted-foreground">
                  {possibleDuplicate.duplicateReason}
                </p>
              )}

              {possibleDuplicate && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Confianza:{" "}
                  {Math.round(possibleDuplicate.duplicateConfidence * 100)}%
                </p>
              )}
            </div>

            {duplicateIncident ? (
              <div className="overflow-hidden rounded-xl border">
                {duplicateIncident.photoUrl && (
                  <img
                    src={duplicateIncident.photoUrl}
                    alt={duplicateIncident.title}
                    className="max-h-56 w-full object-cover"
                  />
                )}

                <div className="space-y-2 p-4">
                  <h3 className="font-semibold">{duplicateIncident.title}</h3>

                  <p className="text-sm text-muted-foreground">
                    {duplicateIncident.description}
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border px-2 py-1">
                      Estado: {duplicateIncident.status}
                    </span>

                    <span className="rounded-full border px-2 py-1">
                      Prioridad: {duplicateIncident.priority}
                    </span>

                    {duplicateIncident.category && (
                      <span className="rounded-full border px-2 py-1">
                        Categoría: {duplicateIncident.category.name}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Reportado por {duplicateIncident.createdBy.name}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border p-3 text-sm text-muted-foreground">
                Cargando incidente...
              </div>
            )}

            <div className="rounded-xl border p-3 text-sm">
              ¿Este es el mismo incidente que querés publicar?
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleConfirmDifferentIncident}
              disabled={isResolvingDuplicate || !duplicateIncident}
            >
              No, crear uno nuevo
            </Button>

            <Button
              type="button"
              onClick={handleConfirmSameIncident}
              disabled={isResolvingDuplicate || !duplicateIncident}
            >
              {isResolvingDuplicate
                ? "Procesando..."
                : "Sí, sumar mi reporte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}