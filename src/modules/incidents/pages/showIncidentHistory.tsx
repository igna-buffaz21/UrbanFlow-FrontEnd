import { useEffect, useState } from "react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { incidentsService } from "../incidents.service";
import type { Incident, IncidentStatus } from "../incidents.type";

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

export const STATUS_LABELS: Record<IncidentStatus, string> = {
    open: "Abierto",
    in_review: "En revisión",
    assigned: "Asignado",
    in_progress: "En progreso",
    resolved: "Resuelto",
    closed: "Cerrado",
    rejected: "Rechazado",
};

export function ShowIncidentsHistoryPage() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function getClosedIncidents() {
            try {
                setIsLoading(true);

                const response = await incidentsService.getIncidents({
                    status: "closed",
                });

                setIncidents(response);
            } catch (error) {
                console.error("Error al cargar historial:", error);
                setIncidents([]);
            } finally {
                setIsLoading(false);
            }
        }

        getClosedIncidents();
    }, []);

    return (
        <div className="flex justify-center p-6">
            <div className="w-full max-w-4xl space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de incidentes</CardTitle>
                        <CardDescription>
                            Visualizá todos los incidentes cerrados.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Título</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Prioridad</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Operador</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="text-center text-sm text-muted-foreground py-8"
                                            >
                                                Cargando...
                                            </TableCell>
                                        </TableRow>
                                    ) : incidents.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="text-center text-sm text-muted-foreground py-8"
                                            >
                                                No hay incidentes cerrados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        incidents.map((incident) => (
                                            <TableRow key={incident.id}>
                                                <TableCell className="font-medium">
                                                    {incident.title}
                                                </TableCell>

                                                <TableCell className="text-muted-foreground">
                                                    {STATUS_LABELS[incident.status] ?? incident.status}
                                                </TableCell>

                                                <TableCell>
                                                    <Badge className={PRIORITY_STYLES[incident.priority]}>
                                                        {PRIORITY_LABELS[incident.priority]}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="text-muted-foreground">
                                                    {new Date(incident.closedAt ?? incident.createdAt).toLocaleDateString("es-AR")}
                                                </TableCell>

                                                <TableCell className="text-muted-foreground">
                                                    {incident.assignedTo?.name ?? "Sin operador"}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            {incidents.length} incidente{incidents.length !== 1 ? "s" : ""}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}