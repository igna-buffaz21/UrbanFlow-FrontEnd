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
import { Trash2, UserCheck, UserX } from "lucide-react";
import { notify } from "@/lib/notify";

interface AssignIncidentPageProps {
    id?: string;
    onClose?: () => void;
}

export function AssignIncidentPage({ id: propId, onClose }: AssignIncidentPageProps = {}) {
    const params = useParams<{ id: string }>();
    const navigate = useNavigate();
    const id = propId ?? params.id;

    const [incident, setIncident] = useState<AdminIncidentDetail | null>(null);
    const [operators, setOperators] = useState<GetUser[]>([]);
    const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isRejecting, setIsRejecting] = useState(false);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false);
    const [isUnassigning, setIsUnassigning] = useState(false);


    const canAssign = (incident?.status === "in_review" || incident?.status === "open") && !incident?.assignedTo;
    const canUnassign = incident?.status === "assigned"
    const selectedOperator = operators.find((op) => op.id === selectedOperatorId);


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

            setTimeout(() => { if (onClose) onClose(); else navigate(APP_ROUTES.panel.incidents); }, 1500);

        } finally {
            setIsAssigning(false);
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
            setTimeout(() => { if (onClose) onClose(); else navigate(APP_ROUTES.panel.incidents); }, 1500);
        } catch {
            notify.error("Error al rechazar el incidente.");
        } finally {
            setIsRejecting(false);
        }
    }

    async function handleUnassign() {
        if (!id) return;
        try {
            setIsUnassigning(true);
            await notify.promise(
                incidentsService.unassignOperator(id),
                {
                    loading: "Desasignando operador...",
                    success: "Operador desasignado correctamente.",
                    error: "Error al desasignar el operador.",
                }
            );
            setIncident((prev) => prev ? { ...prev, status: "open", assignedTo: null } : prev);
            setIsUnassignDialogOpen(false);
        } finally {
            setIsUnassigning(false);
        }
    }

    function handleCancel() {
        if (onClose) onClose();
        else navigate(APP_ROUTES.panel.incidents);
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
                        !canAssign ? (
                            <div className="flex flex-col gap-2 w-full">
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={handleCancel}>
                                        Volver
                                    </Button>

                                    {canUnassign && (
                                        <Button
                                            variant="outline"
                                            className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => setIsUnassignDialogOpen(true)}
                                        >
                                            <UserX className="size-4" />
                                            Cancelar asignación
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 w-full">
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={handleCancel}>
                                        Volver
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => setIsRejectDialogOpen(true)}
                                    >
                                        <Trash2 className="size-4" />
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
                                    <Button
                                        className="bg-green-600/10 text-green-600 border border-green-600/30 hover:bg-green-600/20 hover:text-green-600"
                                        onClick={() => setIsAssignDialogOpen(true)}
                                        disabled={!selectedOperatorId || isAssigning}
                                    >
                                        <UserCheck className="size-4" />
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
                                Motivo de rechazo (obligatorio)
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
                            <Button
                                variant="outline"
                                className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                onClick={handleReject}
                                disabled={isRejecting || !rejectionReason.trim()}
                            >
                                {isRejecting ? "Rechazando..." : "Confirmar rechazo"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Dialog — Confirmar asignación */}
                <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>¿Asignar operador?</DialogTitle>
                            <DialogDescription>
                                ¿Estás seguro que querés asignar a {selectedOperator?.name ?? "este operador"} a este incidente?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                className="bg-green-600/10 text-green-600 border border-green-600/30 hover:bg-green-600/20 hover:text-green-600"
                                onClick={() => { setIsAssignDialogOpen(false); handleAssign(); }}
                                disabled={isAssigning}
                            >
                                {isAssigning ? "Asignando..." : "Confirmar"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isUnassignDialogOpen} onOpenChange={setIsUnassignDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>¿Cancelar asignación?</DialogTitle>
                            <DialogDescription>
                                El incidente volverá a estado abierto y quedará sin operador asignado.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsUnassignDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                variant="outline"
                                className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                onClick={handleUnassign}
                                disabled={isUnassigning}
                            >
                                {isUnassigning ? "Desasignando..." : "Confirmar"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </div>
    );
}
