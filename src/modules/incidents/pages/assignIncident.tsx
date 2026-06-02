import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { incidentsService } from "../incidents.service";
import { userService } from "@/modules/users/user.service";
import type { GetUser } from "@/modules/users/user.types";
import type { AdminIncidentDetail, IncidentStatus } from "../incidents.type";

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

                {/* Detalle del incidente */}
                <Card>
                    <CardHeader>
                        <CardTitle>{incident.title}</CardTitle>
                        <CardDescription>
                            {incident.description ?? "Sin descripción"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">

                        {/* Foto del incidente */}
                        {incident.photoUrl && (
                            <div className="space-y-2">
                                <span className="text-sm font-medium">
                                    Evidencia fotográfica
                                </span>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <img
                                            src={incident.photoUrl}
                                            alt={incident.title}
                                            className="w-full max-h-80 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition"
                                        />
                                    </DialogTrigger>

                                    <DialogContent className="max-w-5xl p-2">
                                        <img
                                            src={incident.photoUrl}
                                            alt={incident.title}
                                            className="w-full h-auto rounded-lg"
                                        />
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}

                        {incident.location && (
                            <div className="space-y-2">
                                <span className="text-sm font-medium">
                                    Ubicación del incidente
                                </span>

                                <div className="h-64 overflow-hidden rounded-lg border">
                                    <Map center={incident.location.coordinates} zoom={16}>
                                        <MapMarker
                                            longitude={incident.location.coordinates[0]}
                                            latitude={incident.location.coordinates[1]}
                                        >
                                            <MarkerContent>
                                                <div className="bg-red-600 size-4 rounded-full border-2 border-white shadow-lg" />
                                            </MarkerContent>

                                            <MarkerTooltip>
                                                {incident.title}
                                            </MarkerTooltip>

                                            <MarkerPopup>
                                                <div>
                                                    <p className="font-medium">{incident.title}</p>
                                                </div>
                                            </MarkerPopup>
                                        </MapMarker>
                                    </Map>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-3 md:grid-cols-2">

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Estado:</span>
                                <span className="text-sm">
                                    {STATUS_LABELS[incident.status]}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Prioridad:</span>
                                <Badge
                                    className={PRIORITY_STYLES[incident.priority]}
                                >
                                    {PRIORITY_LABELS[incident.priority]}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Categoría:</span>
                                <span className="text-sm">
                                    {incident.category?.name ?? "Sin categoría"}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Creado por:</span>
                                <span className="text-sm">
                                    {incident.createdBy?.name ?? "Sin datos"}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Fecha de creación:
                                </span>
                                <span className="text-sm">
                                    {new Date(incident.createdAt).toLocaleString("es-AR")}
                                </span>
                            </div>

                            {incident.assignedTo && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        Asignado a:
                                    </span>
                                    <span className="text-sm">
                                        {incident.assignedTo.name}
                                    </span>
                                </div>
                            )}

                            {incident.assignedAt && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        Fecha de asignación:
                                    </span>
                                    <span className="text-sm">
                                        {new Date(incident.assignedAt).toLocaleString("es-AR")}
                                    </span>
                                </div>
                            )}
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
                                    incident.status === "resolved" ||
                                    incident.status === "closed" ||
                                    incident.status === "assigned"
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
                        {incident.status === "assigned" && (
                            <p className="text-sm text-muted-foreground">
                                Este incidente ya tiene un operador asignado.
                            </p>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}