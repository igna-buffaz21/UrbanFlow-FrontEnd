import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { incidentsService } from "../incidents.service";
import type { AdminIncidentDetail } from "../incidents.type";
import { IncidentDetailCard } from "@/components/IncidentDetailCard";

import { APP_ROUTES } from "@/config/app.routes";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";

const PRIORITY_LABELS: Record<string, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
};

const PRIORITY_STYLES: Record<string, string> = {
    low: "bg-green-500 text-white hover:bg-green-600",
    medium: "bg-yellow-500 text-black hover:bg-yellow-600",
    high: "bg-red-500 text-white hover:bg-red-600",
};

export function ResolvedIncidentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [incident, setIncident] = useState<AdminIncidentDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isReassigning, setIsReassigning] = useState(false);
    const [reassignNote, setReassignNote] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
    const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);

    useEffect(() => {
        async function loadIncident() {
            if (!id) return;

            try {
                setIsLoading(true);
                const data = await incidentsService.getIncidentById(id);
                setIncident(data);
            } catch (error) {
                console.error("Error al cargar incidente:", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadIncident();
    }, [id]);

    async function handleClose() {
        if (!id) return;

        try {
            setIsClosing(true);
            setErrorMessage("");
            await incidentsService.updateStatus(id, "closed");
            setSuccessMessage("Incidente cerrado correctamente.");
            setTimeout(() => navigate(APP_ROUTES.panel.incidentResolved), 1500);
        } catch (error: any) {
            setErrorMessage(error?.response?.data?.message ?? "Error al cerrar el incidente.");
        } finally {
            setIsClosing(false);
        }
    }

    async function handleReassign() {
        if (!id) return;

        try {
            setIsReassigning(true);
            setErrorMessage("");
            await incidentsService.updateStatus(id, "in_progress");
            setSuccessMessage("Incidente devuelto al operador correctamente.");
            setTimeout(() => navigate(APP_ROUTES.panel.incidentResolved), 1500);
        } catch (error: any) {
            setErrorMessage(error?.response?.data?.message ?? "Error al reasignar el incidente.");
        } finally {
            setIsReassigning(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center p-6">
                <p className="text-muted-foreground">Cargando...</p>
            </div>
        );
    }

    if (!incident) {
        return (
            <div className="flex justify-center p-6">
                <p className="text-muted-foreground">No se encontró el incidente.</p>
            </div>
        );
    }

    return (
        <div className="flex justify-center p-6">
            <div className="w-full max-w-2xl space-y-4">

                <IncidentDetailCard
                    incident={incident}
                    showMap={true}
                />
                <Card>

                    <CardContent className="space-y-4">

                        {/* Botones de acción */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={() => setIsCloseDialogOpen(true)}
                                disabled={isClosing || isReassigning}
                            >
                                Cerrar incidente
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setIsReassignDialogOpen(true)}
                                disabled={isClosing || isReassigning}
                            >
                                Devolver al operador
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => navigate(APP_ROUTES.panel.incidentResolved)}
                            >
                                Volver
                            </Button>
                        </div>

                        {/* Dialog cerrar — fuera de la Card */}
                        <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>¿Cerrar incidente?</DialogTitle>
                                    <DialogDescription>
                                        Confirmá que el incidente fue resuelto correctamente. Esta acción no se puede deshacer.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCloseDialogOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button onClick={handleClose} disabled={isClosing}>
                                        {isClosing ? "Cerrando..." : "Confirmar cierre"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Dialog devolver — fuera de la Card */}
                        <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>¿Devolver al operador?</DialogTitle>
                                    <DialogDescription>
                                        El incidente volverá a estado "en progreso". Podés dejar un mensaje para el operador.
                                    </DialogDescription>
                                </DialogHeader>

                                <FieldSet>
                                    <FieldGroup>
                                        <Field>
                                            <FieldLabel>Mensaje para el operador (opcional)</FieldLabel>
                                            <Textarea
                                                placeholder="Ej: Falta revisar la conexión eléctrica..."
                                                value={reassignNote}
                                                onChange={(e) => setReassignNote(e.target.value)}
                                            />
                                        </Field>
                                    </FieldGroup>
                                </FieldSet>

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => { setIsReassignDialogOpen(false); setReassignNote(""); }}>
                                        Cancelar
                                    </Button>
                                    <Button variant="destructive" onClick={handleReassign} disabled={isReassigning}>
                                        {isReassigning ? "Devolviendo..." : "Confirmar"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}