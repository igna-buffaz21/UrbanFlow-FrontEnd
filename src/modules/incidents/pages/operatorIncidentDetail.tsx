import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { incidentsService } from "../incidents.service";
import type { AdminIncidentDetail, IncidentStatus } from "../incidents.type";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";


export function OperatorIncidentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [incident, setIncident] = useState<AdminIncidentDetail | null>(null);
    const [status, setStatus] = useState<IncidentStatus>("assigned");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const STATUS_LABELS: Record<string, string> = {
        in_review: "En revisión",
        open: "Abierto",
        assigned: "Asignado",
        resolved: "Resuelto",
        closed: "Cerrado",
        rejected: "Rechazado",
    };

    useEffect(() => {
        async function loadIncident() {
            if (!id) return;

            try {
                setIsLoading(true);

                const data = await incidentsService.getIncidentById(id);

                setIncident(data);
                setStatus(data.status || "assigned");
            } catch (error) {
                console.error("Error al cargar incidente:", error);
                alert("No se pudo cargar el detalle del incidente");
            } finally {
                setIsLoading(false);
            }
        }

        loadIncident();
    }, [id]);

    async function handleSave() {
        if (!id) return;

        try {
            setIsSaving(true);
            await incidentsService.updateIncidentStatus(id, status);
            navigate("/operator");
        } catch (error) {
            console.error("Error al guardar cambios:", error);
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return <p className="p-6 text-muted-foreground">Cargando...</p>;
    }

    if (!incident) {
        return (
            <div className="p-6 space-y-4">
                <p className="text-muted-foreground">No se encontró el incidente.</p>

                <Button
                    variant="outline"
                    onClick={() => navigate("/operator")}
                >
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
                                    ? new Date(incident.createdAt).toLocaleString()
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

                    <div>
                        <p className="mb-2 text-sm text-muted-foreground">Actualizar estado</p>
                        <Select value={status} onValueChange={(value) => setStatus(value as IncidentStatus)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="assigned">Asignado</SelectItem>
                                <SelectItem value="resolved">Resuelto</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <p className="mb-2 text-sm text-muted-foreground">Notas del operador</p>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Agregar observaciones..."
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "Guardando..." : "Guardar cambios"}
                        </Button>

                        <Button variant="outline" onClick={() => navigate("/operator")}>
                            Cancelar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}