import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { incidentsService } from "../incidents.service";
import { userService } from "@/modules/users/user.service";
import type { GetUser } from "@/modules/users/user.types";
import type { AdminIncidentDetail, IncidentStatus } from "../incidents.type";
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
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Map,
    MapMarker,
    MarkerContent,
    MarkerPopup,
    MarkerTooltip,
} from "@/components/ui/map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

const STATUS_LABELS: Record<IncidentStatus, string> = {
    open: "Abierto",
    in_review: "En revisión",
    assigned: "Asignado",
    in_progress: "En progreso",
    resolved: "Resuelto",
    closed: "Cerrado",
    rejected: "Rechazado",
};

const PRIORITY_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    low: "secondary",
    medium: "outline",
    high: "default",
};

export function AssignIncidentPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [incident, setIncident] = useState<AdminIncidentDetail | null>(null);
    const [operators, setOperators] = useState<GetUser[]>([]);
    const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const canAssign = incident?.status === "in_review" && !incident?.assignedTo;
    console.log("Estado incidente:", incident?.status);
    console.log("Asignado a:", incident?.assignedTo);
    console.log("canAssign:", canAssign);

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
            setErrorMessage("");
            await incidentsService.assignOperator(id, selectedOperatorId);
            setSuccessMessage("Operador asignado correctamente.");
            setTimeout(() => navigate(APP_ROUTES.panel.incidents), 1500);
        } catch (error: any) {
            setErrorMessage(error?.response?.data?.message ?? "Error al asignar el operador.");
        } finally {
            setIsAssigning(false);
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
                />

                {/* Lista de operadores */}
                <Card>
                    <CardHeader>
                        <CardTitle>Operadores</CardTitle>
                        <CardDescription>
                            Seleccioná un operador para asignarle este incidente.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-2">
                        {incident.assignedTo && (
                            <div className="rounded-lg border bg-muted/30 p-3">
                                <p className="text-sm">
                                    <span className="font-medium">Asignado a:</span>{" "}
                                    {incident.assignedTo.name}
                                </p>
                            </div>
                        )}

                        {operators.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No hay operadores disponibles.
                            </p>
                        ) : (
                            operators.map((operator) => (
                                <div
                                    key={operator.id}
                                    onClick={() => {
                                        if (!canAssign) return;
                                        setSelectedOperatorId(operator.id);
                                    }} className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${!canAssign
                                        ? "opacity-60 cursor-not-allowed"
                                        : selectedOperatorId === operator.id
                                            ? "border-primary bg-primary/10 cursor-pointer"
                                            : "hover:bg-muted/50 cursor-pointer"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        readOnly
                                        disabled={!canAssign}
                                        checked={selectedOperatorId === operator.id}
                                        className="accent-primary"
                                    />
                                    <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium truncate">{operator.name}</span>
                                            <span className="text-xs text-muted-foreground truncate">{operator.email}</span>
                                        </div>
                                        <Badge
                                            variant={operator.status === "active" ? "default" : "secondary"}
                                            className="shrink-0"
                                        >
                                            {operator.status === "active" ? "Disponible" : "Inactivo"}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        )}

                        <div className="flex gap-2 pt-4">
                            {successMessage && (
                                <p className="text-sm text-green-500">{successMessage}</p>
                            )}
                            {errorMessage && (
                                <p className="text-sm text-destructive">{errorMessage}</p>
                            )}
                            <Button
                                onClick={handleAssign}
                                disabled={
                                    !selectedOperatorId ||
                                    isAssigning ||
                                    !canAssign
                                }
                            >
                                {isAssigning ? "Asignando..." : "Confirmar asignación"}
                            </Button>
                            {(incident.status === "resolved" || incident.status === "closed") && (
                                <p className="text-sm text-muted-foreground">
                                    Este incidente ya fue resuelto y no puede recibir nuevas asignaciones.
                                </p>
                            )}

                            <Button variant="outline" onClick={handleCancel}>
                                Cancelar
                            </Button>
                        </div>
                        {!canAssign && (
                            <p className="text-sm text-muted-foreground">
                                Solo se pueden asignar operadores a incidentes en estado "En revisión".
                            </p>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}