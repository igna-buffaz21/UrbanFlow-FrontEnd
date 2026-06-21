import axios from "axios";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { incidentsService } from "../incidents.service";
import { userService } from "@/modules/users/user.service";
import type { GetUser } from "@/modules/users/user.types";
import type { AdminIncidentDetail } from "../incidents.type";
import { IncidentDetailCard } from "@/components/IncidentDetailCard";

import { APP_ROUTES } from "@/config/app.routes";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { notify } from "@/lib/notify";

export function AssignIncidentPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [incident, setIncident] = useState<AdminIncidentDetail | null>(null);
    const [operators, setOperators] = useState<GetUser[]>([]);
    const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
    const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isReassigning, setIsReassigning] = useState(false);
    const [reassignNote, setReassignNote] = useState("");
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isRejecting, setIsRejecting] = useState(false);

    const canAssign = (incident?.status === "in_review" || incident?.status === "open") && !incident?.assignedTo;

    useEffect(() => {
        async function loadData() {
            if (!id) return;
            try {
                setIsLoading(true);
                const [incidentData, operatorsData] = await Promise.all([
                    incidentsService.getIncidentById(id),
                    userService.getOperators(),
                ]);
                setIncident(incidentData);
                setOperators(operatorsData.filter(op => op.status === "active"));
            } catch (error) {
                console.error("Error al cargar datos:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [id]);

    async function handleAssign() {
        if (!id || !selectedOperatorId) return;

        try {
            setIsAssigning(true);

            await notify.promise(
                incidentsService.assignOperator(id, selectedOperatorId),
                {
                    loading: "Asignando operador...",
                    success: "Operador asignado correctamente.",
                    error: "Error al asignar el operador.",
                }
            );

            setTimeout(() => navigate(APP_ROUTES.panel.incidents), 1500);

        } finally {
            setIsAssigning(false);
        }
    }

    async function handleClose() {
        if (!id) return;

        try {
            setIsClosing(true);
            await incidentsService.updateStatus(id, "closed");
            notify.success("Incidente cerrado correctamente.");
            setIsCloseDialogOpen(false);
            setTimeout(() => navigate(APP_ROUTES.panel.incidents), 1500);
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.message ?? "Error al cerrar el incidente."
                );
                return;
            }

            setErrorMessage("Error al cerrar el incidente.");

        } finally {
            setIsClosing(false);
        }
    }

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
                () => navigate(APP_ROUTES.panel.incidents),
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

    async function handleReject() {
        if (!id || !rejectionReason.trim()) return;
        try {
            setIsRejecting(true);
            await incidentsService.rejectIncident(id, rejectionReason);
            notify.success("Incidente rechazado.");
            setIsRejectDialogOpen(false);
            setRejectionReason("");
            setTimeout(() => navigate(APP_ROUTES.panel.incidents), 1500);
        } catch {
            notify.error("Error al rechazar el incidente.");
        } finally {
            setIsRejecting(false);
        }
    }

    function handleCancel() {
        navigate(APP_ROUTES.panel.incidents);
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
                        incident.status === "resolved" ? (
                            <div className="flex flex-col gap-2 w-full">
                                <div className="flex gap-2">
                                    <Button onClick={() => setIsCloseDialogOpen(true)} disabled={isClosing || isReassigning}>
                                        Cerrar incidente
                                    </Button>
                                    <Button variant="outline" onClick={() => setIsReassignDialogOpen(true)} disabled={isClosing || isReassigning}>
                                        Devolver al operador
                                    </Button>
                                    <Button variant="outline" onClick={handleCancel}>Volver</Button>
                                </div>
                            </div>
                        ) : !canAssign ? (
                            <div className="flex flex-col gap-2 w-full">
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={handleCancel}>Volver</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 w-full">
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={handleCancel}>Volver</Button>
                                    <Button variant="outline" onClick={() => setIsRejectDialogOpen(true)}>
                                        Rechazar incidente
                                    </Button>
                                </div>
                            </div>
                        )
                    }
                />

                {canAssign && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Operadores</CardTitle>
                            <CardDescription>
                                Seleccioná un operador para asignarle este incidente.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-2">
                            {operators.map((operator) => (
                                <div
                                    key={operator.id}
                                    onClick={() => setSelectedOperatorId(operator.id)}
                                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${selectedOperatorId === operator.id
                                        ? "border-primary bg-primary/10"
                                        : "hover:bg-muted/50"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        readOnly
                                        checked={selectedOperatorId === operator.id}
                                        className="accent-primary"
                                    />
                                    <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium truncate">{operator.name}</span>
                                            <span className="text-xs text-muted-foreground truncate">{operator.email}</span>
                                        </div>
                                        <Badge variant="default" className="shrink-0">
                                            Disponible
                                        </Badge>
                                    </div>
                                </div>
                            ))}

                            <div className="flex flex-col gap-2 pt-4">
                                <div className="flex gap-2">
                                    <Button onClick={handleAssign} disabled={!selectedOperatorId || isAssigning}>
                                        {isAssigning ? "Asignando..." : "Confirmar asignación"}
                                    </Button>
                                    <Button variant="outline" onClick={handleCancel}>
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

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
                            <Button variant="destructive" onClick={handleReassign} disabled={isReassigning}>
                                {isReassigning ? "Devolviendo..." : "Confirmar"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Dialog — Rechazar incidente */}
                <Dialog open={isRejectDialogOpen} onOpenChange={(open) => { setIsRejectDialogOpen(open); if (!open) setRejectionReason(""); }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>¿Rechazar incidente?</DialogTitle>
                            <DialogDescription>
                                Explicá el motivo del rechazo. El ciudadano podrá verlo.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 pt-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Motivo de rechazo
                            </label>
                            <textarea
                                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                                placeholder="Ej: El incidente no corresponde a la vía pública..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setIsRejectDialogOpen(false); setRejectionReason(""); }}>
                                Cancelar
                            </Button>
                            <Button variant="outline" onClick={handleReject} disabled={isRejecting || !rejectionReason.trim()}>
                                {isRejecting ? "Rechazando..." : "Confirmar rechazo"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </div>
    );
}

function setErrorMessage(arg0: string) {
    throw new Error(arg0);
}
