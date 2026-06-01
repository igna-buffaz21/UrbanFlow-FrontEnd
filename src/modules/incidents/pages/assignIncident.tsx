import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { incidentsService } from "../incidents.service";
import { userService } from "@/modules/users/user.service";
import type { GetUser } from "@/modules/users/user.types";
import type { AdminIncidentDetail } from "../incidents.type";

import { APP_ROUTES } from "@/config/app.routes";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PRIORITY_LABELS: Record<string, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
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
                setOperators(operatorsData);
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
            await incidentsService.assignOperator(id, selectedOperatorId);
            navigate(APP_ROUTES.panel.incidents);
        } catch (error) {
            console.error("Error al asignar operador:", error);
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

                {/* Detalle del incidente */}
                <Card>
                    <CardHeader>
                        <CardTitle>{incident.title}</CardTitle>
                        <CardDescription>{incident.description ?? "Sin descripción"}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Estado:</span>
                            <span className="text-sm">{incident.status}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Prioridad:</span>
                            <Badge variant={PRIORITY_VARIANTS[incident.priority]}>
                                {PRIORITY_LABELS[incident.priority]}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Categoría:</span>
                            <span className="text-sm">{incident.category?.name ?? "Sin categoría"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Creado por:</span>
                            <span className="text-sm">{incident.createdBy?.name ?? "Sin datos"}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de operadores */}
                <Card>
                    <CardHeader>
                        <CardTitle>Operadores</CardTitle>
                        <CardDescription>
                            Seleccioná un operador para asignarle este incidente.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-2">
                        {operators.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No hay operadores disponibles.
                            </p>
                        ) : (
                            operators.map((operator) => (
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
                            <Button
                                onClick={handleAssign}
                                disabled={!selectedOperatorId || isAssigning}
                            >
                                {isAssigning ? "Asignando..." : "Confirmar asignación"}
                            </Button>

                            <Button variant="outline" onClick={handleCancel}>
                                Cancelar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}