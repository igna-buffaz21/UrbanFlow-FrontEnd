import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { incidentsService } from "../incidents.service";
import type { AdminIncidentDetail } from "../incidents.type";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, string> = {
  in_review: "En revisión",
  open: "Abierto",
  assigned: "Asignado",
  resolved: "Resuelto",
  closed: "Cerrado",
  rejected: "Rechazado",
};

export function OperatorIncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<AdminIncidentDetail | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"assigned" | "resolved">("assigned");
  const [resolvedImage, setResolvedImage] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  useEffect(() => {
    async function loadIncident() {
      if (!id) return;

      try {
        setIsLoading(true);

        const data = await incidentsService.getIncidentById(id);

        setIncident(data);

        if (data.status === "resolved") {
          setSelectedStatus("resolved");
        } else {
          setSelectedStatus("assigned");
        }
      } catch (error) {
        console.error("Error al cargar incidente:", error);
        alert("No se pudo cargar el detalle del incidente");
      } finally {
        setIsLoading(false);
      }
    }

    loadIncident();
  }, [id]);

  async function handleSaveStatus() {
    if (!id) return;

    if (selectedStatus === "resolved" && !resolvedImage) {
      alert("Para marcarlo como resuelto tenés que subir una foto.");
      return;
    }

    const formData = new FormData();

    formData.append("status", selectedStatus);

    if (resolvedImage) {
      formData.append("image", resolvedImage);
    }

    try {
      setIsSavingStatus(true);

      await incidentsService.updateIncidentStatus(id, formData);

      navigate("/operator");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "No se pudo actualizar el estado.";

      console.log("Mensaje backend:", error?.response?.data?.message);
      console.log("Respuesta completa:", error?.response?.data);

      alert(message);
    } finally {
      setIsSavingStatus(false);
    }
  }

  if (isLoading) {
    return <p className="p-6 text-muted-foreground">Cargando...</p>;
  }

  if (!incident) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-muted-foreground">No se encontró el incidente.</p>

        <Button variant="outline" onClick={() => navigate("/operator")}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Incidente #{incident.id.slice(-4)}</CardTitle>
          <CardDescription>{incident.title}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Descripción</p>
            <p className="text-sm">{incident.description || "Sin descripción"}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Estado actual</p>
              <Badge variant="secondary">
                {STATUS_LABELS[incident.status] ?? incident.status}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Prioridad</p>
              <Badge variant="outline">{incident.priority}</Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Categoría</p>
              <p className="text-sm">{incident.category?.name ?? "Sin categoría"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Creado por</p>
              <p className="text-sm">{incident.createdBy?.name ?? "Sin datos"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Fecha de creación</p>
              <p className="text-sm">
                {incident.createdAt
                  ? new Date(incident.createdAt).toLocaleString("es-AR")
                  : "-"}
              </p>
            </div>
          </div>

          {incident.photoUrl && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Foto del incidente</p>
              <img
                src={incident.photoUrl}
                alt={incident.title}
                className="max-h-64 w-full rounded-md border object-cover"
              />
            </div>
          )}

          <div className="space-y-3 rounded-xl border p-4">
            <p className="text-sm font-medium">Actualizar estado</p>

            <Select
              value={selectedStatus}
              onValueChange={(value) =>
                setSelectedStatus(value as "assigned" | "resolved")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="assigned">Asignado</SelectItem>
                <SelectItem value="resolved">Resuelto</SelectItem>
              </SelectContent>
            </Select>

            {selectedStatus === "resolved" && (
              <Input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setResolvedImage(event.target.files?.[0] ?? null)
                }
              />
            )}

            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                Notas del operador
              </p>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Agregar observaciones..."
              />
            </div>

            <Button
              onClick={handleSaveStatus}
              disabled={isSavingStatus}
              className="w-full"
            >
              {isSavingStatus ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>

          <Button variant="outline" onClick={() => navigate("/operator")} className="w-full">
            Cancelar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}