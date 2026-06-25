import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import { incidentsService } from "../incidents.service";
import type {
    IncidentPriority,
    IncidentStatus,
    OperatorIncident,
} from "../incidents.type";

import { IncidentDetailDialogOperador } from "@/components/dialog-incident-operador";

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
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
    assigned: "Asignado",
    in_progress: "En progreso",
    resolved: "Resuelto",
};

const PRIORITY_LABELS: Record<string, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
};

const PRIORITY_VARIANTS: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
> = {
    low: "secondary",
    medium: "outline",
    high: "destructive",
};

export function ShowOperatorIncidents() {
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const [incidents, setIncidents] = useState<OperatorIncident[]>([]);
    const [status, setStatus] = useState<IncidentStatus | "all">("all");
    const [priority, setPriority] = useState<IncidentPriority | "all">("all");
    const [isLoading, setIsLoading] = useState(false);

    const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

    async function handleLogout() {
        await signOut();
        navigate("/login", { replace: true });
    }

    async function loadIncidents() {
        try {
            setIsLoading(true);

            const filters = {
                status: status === "all" ? undefined : status,
                priority: priority === "all" ? undefined : priority,
            };

            const data = await incidentsService.getAssignedIncidents(filters);

            const visibleIncidents = data.filter(
                (incident) => incident.status !== "resolved"
            );

            setIncidents(visibleIncidents);
        } catch (error) {
            console.error("Error al obtener incidentes asignados:", error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadIncidents();
    }, [status, priority]);

    function handleOpenDetail(incidentId: string) {
        setSelectedIncidentId(incidentId);
        setIsDetailDialogOpen(true);
    }

    return (
        <div className="min-h-dvh w-full px-3 py-4 sm:flex sm:justify-center sm:p-6">
            <Card className="w-full max-w-5xl">
                <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <CardTitle>Mis incidentes asignados</CardTitle>
                            <CardDescription>
                                Consultá y gestioná los incidentes que tenés asignados.
                            </CardDescription>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            className="w-full sm:w-auto"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Cerrar sesión
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <Select
                            value={status}
                            onValueChange={(value) => setStatus(value as IncidentStatus | "all")}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">Todos los estados</SelectItem>
                                <SelectItem value="assigned">Asignado</SelectItem>
                                <SelectItem value="in_progress">En progreso</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={priority}
                            onValueChange={(value) =>
                                setPriority(value as IncidentPriority | "all")
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Prioridad" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">Todas las prioridades</SelectItem>
                                <SelectItem value="low">Baja</SelectItem>
                                <SelectItem value="medium">Media</SelectItem>
                                <SelectItem value="high">Alta</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {isLoading ? (
                            <Card className="md:col-span-2 xl:col-span-3">
                                <CardContent className="py-8 text-center">
                                    Cargando...
                                </CardContent>
                            </Card>
                        ) : incidents.length === 0 ? (
                            <Card className="md:col-span-2 xl:col-span-3">
                                <CardContent className="py-8 text-center">
                                    No tenés incidentes asignados.
                                </CardContent>
                            </Card>
                        ) : (
                            incidents.map((incident) => (
                                <Card
                                    key={incident.id}
                                    onClick={() => handleOpenDetail(incident.id)}
                                    className="cursor-pointer overflow-hidden transition-all hover:bg-muted/50 hover:border-primary"
                                >
                                    {incident.photoUrl && (
                                        <div className="h-48 overflow-hidden border-b">
                                            <img
                                                src={incident.photoUrl}
                                                alt={incident.title}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    )}

                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <CardTitle className="truncate text-base">
                                                    {incident.title}
                                                </CardTitle>

                                                <CardDescription>
                                                    {incident.assignedAt
                                                        ? `Asignado el ${new Date(
                                                            incident.assignedAt
                                                        ).toLocaleDateString("es-AR")}`
                                                        : "Sin fecha"}
                                                </CardDescription>
                                            </div>

                                            <Badge variant={PRIORITY_VARIANTS[incident.priority]}>
                                                {PRIORITY_LABELS[incident.priority]}
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                Estado
                                            </span>

                                            <Badge variant="outline">
                                                {STATUS_LABELS[incident.status] ?? incident.status}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                        {incidents.length} incidentes
                    </p>
                </CardContent>
            </Card>

            <IncidentDetailDialogOperador
                incidentId={selectedIncidentId}
                open={isDetailDialogOpen}
                onOpenChange={(open) => {
                    setIsDetailDialogOpen(open);

                    if (!open) {
                        loadIncidents();
                    }
                }}
            />
        </div>
    );
}