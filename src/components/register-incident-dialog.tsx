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
} from "./incident-picker"
import { incidentsService } from "@/modules/incidents/incidents.service";
import { useAppToast } from "./app-alert-toast";

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
  const toast = useAppToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<MapCenter | null>(
    defaultLocation
  );
  const [image, setImage] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const isValid = Boolean(
    title.trim() &&
      description.trim() &&
      selectedLocation &&
      image &&
      ACCEPTED_IMAGE_TYPES.includes(image.type)
  );

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    console.log("Selected file:", file);

    if (!file) {
      setImage(null);
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImage(null);
      setErrorMessage("La imagen debe ser JPG, PNG, WEBP, HEIC o HEIF.");
      return;
    }

    setErrorMessage(null);
    setImage(file);
  }

  function handleUseCurrentLocation() {
    if (!defaultLocation) {
      setErrorMessage("No se pudo obtener tu ubicación actual.");
      return;
    }

    setSelectedLocation(defaultLocation);
    setErrorMessage(null);
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setSelectedLocation(defaultLocation);
    setImage(null);
    setErrorMessage(null);
  }

  async function handleSubmit() {
    if (!selectedLocation || !image) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const location: CreateIncidentLocation = {
        type: "Point",
        coordinates: selectedLocation,
      };

      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("location", JSON.stringify(location));
      formData.append("image", image);

      await incidentsService.createIncident(formData);

      resetForm();
      onOpenChange(false);
      onCreated?.();

      //toast.success("Incidente reportado con éxito.");
    } catch (error) {
      console.error(error);
      //toast.error("No se pudo reportar el incidente.");
    } finally {
      setIsSubmitting(false);
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
    <toast.Toast />


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
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>

            <Textarea
              id="description"
              placeholder="Describí brevemente qué ocurrió o cuál es el problema."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
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
                  onChange={setSelectedLocation}
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
            disabled={isSubmitting}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="gap-2"
          >
            <AlertTriangle className="size-4" />
            {isSubmitting ? "Reportando..." : "Reportar incidente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}