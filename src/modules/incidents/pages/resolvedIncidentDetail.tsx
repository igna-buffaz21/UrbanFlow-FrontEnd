import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { incidentsService } from "../incidents.service";
import type { AdminIncidentDetail } from "../incidents.type";
import { IncidentDetailCard } from "@/components/IncidentDetailCard";

import { APP_ROUTES } from "@/config/app.routes";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { notify } from "@/lib/notify";

export function ResolvedIncidentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();


    const [incident, setIncident] = useState<AdminIncidentDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
    const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
    const [isReassigning, setIsReassigning] = useState(false);
    const [reassignNote, setReassignNote] = useState("");

    useEffect(() => {
        async function loadData() {
            if (!id) return;
            try {
                setIsLoading(true);
                const incidentData =
                    await incidentsService.getIncidentById(id);

                setIncident(incidentData);
            } catch (error) {
                console.error("Error al cargar datos:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [id]);

    async function handleReassign() {
        if (!id) return;
        try {
            setIsReassigning(true);
            await incidentsService.updateStatus(id, "assigned");
            notify.success(
                "Incidente devuelto al operador correctamente."
            );
            setIsReassignDialogOpen(false);
            setTimeout(
                () => navigate(APP_ROUTES.panel.incidentResolved),
                1500
            );
        } catch (error: any) {
            notify.error(
                error?.response?.data?.message ??
                "Error al devolver el incidente."
            );
        } finally {
            setIsReassigning(false);
        }
    }

    async function handleClose() {
        if (!id) return;

        try {
            setIsClosing(true);

            await incidentsService.updateStatus(id, "closed");

            notify.success("Incidente cerrado correctamente.");

            setIsCloseDialogOpen(false);

            setTimeout(
                () => navigate(APP_ROUTES.panel.incidentResolved),
                1500
            );
        } catch (error: any) {
            notify.error(
                error?.response?.data?.message ??
                "Error al cerrar el incidente."
            );
        } finally {
            setIsClosing(false);
        }
    }

    function handleCancel() {
        navigate(APP_ROUTES.panel.incidentResolved)
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
                    actions={
                        <div className="flex gap-2">
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
                                onClick={handleCancel}
                            >
                                Volver
                            </Button>
                        </div>
                    }
                />

                {/* Dialog — Cerrar incidente */}
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

                {/* Dialog — Devolver al operador */}
                <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>¿Devolver al operador?</DialogTitle>
                            <DialogDescription>
                                El incidente volverá a estar asignado. Podés dejar un mensaje para el operador.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-2 pt-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Mensaje para el operador (opcional)
                            </label>
                            <textarea
                                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                                placeholder="Ej: Falta revisar la conexión eléctrica..."
                                value={reassignNote}
                                onChange={(e) => setReassignNote(e.target.value)}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => { setIsReassignDialogOpen(false); setReassignNote(""); }}
                            >
                                Cancelar
                            </Button>
                            <Button onClick={handleReassign} disabled={isReassigning}>
                                {isReassigning ? "Devolviendo..." : "Confirmar"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

