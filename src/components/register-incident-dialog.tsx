import { useState, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Camera,
  MapPin,
  X,
  Flame,
  Zap,
  Droplets,
  ShieldAlert,
  Car,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const INCIDENT_TYPES = [
  { value: "fire", label: "Incendio", icon: Flame, color: "text-orange-500" },
  { value: "electrical", label: "Falla eléctrica", icon: Zap, color: "text-yellow-500" },
  { value: "flood", label: "Inundación", icon: Droplets, color: "text-blue-500" },
  { value: "security", label: "Seguridad", icon: ShieldAlert, color: "text-red-500" },
  { value: "accident", label: "Accidente vial", icon: Car, color: "text-purple-500" },
  { value: "other", label: "Otro", icon: HelpCircle, color: "text-muted-foreground" },
];

const SEVERITY_LEVELS = [
  { value: "low", label: "Bajo", className: "border-green-500 text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:text-green-400" },
  { value: "medium", label: "Medio", className: "border-yellow-500 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-400" },
  { value: "high", label: "Alto", className: "border-red-500 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:text-red-400" },
];

interface RegisterIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegisterIncidentDialog({ open, onOpenChange }: RegisterIncidentDialogProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newPhotos = files.slice(0, 3 - photos.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 3));
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleSubmit() {
    // lógica de envío aquí
    onOpenChange(false);
  }

  function handleClose() {
    setSelectedType(null);
    setSelectedSeverity(null);
    setPhotos([]);
    setDescription("");
    setAddress("");
    onOpenChange(false);
  }

  const isValid = selectedType && selectedSeverity && description.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] rounded-2xl p-0 gap-0 overflow-hidden">

        {/* Header con acento visual */}
        <div className="bg-destructive/5 border-b px-5 pt-5 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <div className="bg-destructive/10 p-1.5 rounded-lg">
                <AlertTriangle className="size-4 text-destructive" />
              </div>
              Registrar incidente
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Completá los datos para reportar un incidente en tu zona.
            </p>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto max-h-[70vh] px-5 py-4 space-y-5">

          {/* Tipo de incidente */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tipo de incidente <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {INCIDENT_TYPES.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedType(value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all duration-150",
                    selectedType === value
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-muted-foreground/40 hover:bg-muted/40"
                  )}
                >
                  <Icon className={cn("size-5", selectedType === value ? "text-primary" : color)} />
                  <span className="text-[11px] font-medium leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Severidad */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nivel de severidad <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              {SEVERITY_LEVELS.map(({ value, label, className }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedSeverity(value)}
                  className={cn(
                    "flex-1 py-2 rounded-lg border-2 text-xs font-semibold transition-all duration-150",
                    selectedSeverity === value
                      ? className
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Descripción <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describí brevemente qué está pasando..."
              className="resize-none min-h-[80px] text-sm rounded-xl"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
            />
            <p className="text-right text-[11px] text-muted-foreground">{description.length}/300</p>
          </div>

          {/* Dirección aproximada */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Dirección aproximada
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                id="address"
                placeholder="Ej: Av. Corrientes 1234"
                className="pl-8 text-sm rounded-xl"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Fotos */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Fotos <span className="text-muted-foreground font-normal normal-case">(máx. 3)</span>
            </Label>
            <div className="flex gap-2 flex-wrap">
              {photos.map((photo, i) => (
                <div key={i} className="relative size-20 rounded-xl overflow-hidden border">
                  <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 hover:bg-black/80 transition-colors"
                  >
                    <X className="size-3 text-white" />
                  </button>
                </div>
              ))}

              {photos.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="size-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-150"
                >
                  <Camera className="size-5" />
                  <span className="text-[10px] font-medium">Agregar</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="border-t px-5 py-4 bg-muted/20">
          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button variant="ghost" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              className="flex-1 gap-2 rounded-xl"
            >
              <AlertTriangle className="size-3.5" />
              Reportar
            </Button>
          </DialogFooter>
        </div>

      </DialogContent>
    </Dialog>
  );
}