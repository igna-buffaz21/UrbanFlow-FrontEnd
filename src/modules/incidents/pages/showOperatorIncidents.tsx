import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { incidentsService } from "../incidents.service";
import type { IncidentPriority, IncidentStatus, OperatorIncident } from "../incidents.type";

import { APP_ROUTES } from "@/config/app.routes";

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

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
    assigned: "Asignado",
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
    const navigate = useNavigate();

    const [incidents, setIncidents] = useState<OperatorIncident[]>([]);
    const [status, setStatus] = useState<IncidentStatus | "all">("all");
    const [priority, setPriority] = useState<IncidentPriority | "all">("all");
    const [isLoading, setIsLoading] = useState(false);

    async function loadIncidents() {
        try {
            setIsLoading(true);

            const filters = {
                status: status === "all" ? undefined : status,
                priority: priority === "all" ? undefined : priority,
            };

            const data = await incidentsService.getAssignedIncidents(filters);

            setIncidents(data);
        } catch (error) {
            console.error("Error al obtener incidentes asignados:", error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadIncidents();
    }, [status, priority]);

    return (
        <div className="flex justify-center p-6">
            <Card className="w-full max-w-5xl">
                <CardHeader>
                    <CardTitle>Mis incidentes asignados</CardTitle>
                    <CardDescription>
                        Consultá y gestioná los incidentes que tenés asignados.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="grid gap-2 md:grid-cols-2">
                        <Select
                            value={status}
                            onValueChange={(value) => setStatus(value as IncidentStatus | "all")}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">Todos los estados</SelectItem>
                                <SelectItem value="assigned">Asignado</SelectItem>
                                <SelectItem value="resolved">Resuelto</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={priority}
                            onValueChange={(value) =>
                                setPriority(value as IncidentPriority | "all")
                            }
                        >
                            <SelectTrigger>
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

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Prioridad</TableHead>
                                    <TableHead>Asignado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-8 text-center">
                                            Cargando...
                                        </TableCell>
                                    </TableRow>
                                ) : incidents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-8 text-center">
                                            No tenés incidentes asignados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    incidents.map((incident) => (
                                        <TableRow key={incident.id}>
                                            <TableCell className="font-medium">
                                                {incident.title}
                                            </TableCell>

                                            <TableCell>
                                                {STATUS_LABELS[incident.status] ?? incident.status}
                                            </TableCell>

                                            <TableCell>
                                                <Badge variant={PRIORITY_VARIANTS[incident.priority]}>
                                                    {PRIORITY_LABELS[incident.priority]}
                                                </Badge>
                                            </TableCell>

                                            <TableCell>
                                                {incident.assignedAt
                                                    ? new Date(incident.assignedAt).toLocaleDateString()
                                                    : "-"}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        navigate(APP_ROUTES.operator.incidentDetailPath(incident.id))
                                                    }
                                                >
                                                    Ver detalle
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        {incidents.length} incidentes
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}