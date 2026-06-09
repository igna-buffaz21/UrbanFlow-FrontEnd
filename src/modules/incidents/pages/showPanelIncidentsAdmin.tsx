import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const PRIORITY_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    low: "secondary",
    medium: "outline",
    high: "default",
};

export function ShowAdminIncidentsPage() {
    const navigate = useNavigate();

    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [priority, setPriority] = useState("all");
    const [isLoading, setIsLoading] = useState(false);
    const visibleIncidents = incidents.filter(incident => incident.status !== "closed");

    useEffect(() => {
        async function getIncidents() {
            try {
                setIsLoading(true);

                const filters = priority !== "all" ? { priority } : undefined;
                const response = await incidentsService.getIncidents(filters);
                console.table(
                    response.map(i => ({
                        title: i.title,
                        priority: i.priority,
                    }))
                );
                setIncidents(response);
            } catch (error) {
                console.error("Error al cargar incidentes:", error);
                setIncidents([]);
            } finally {
                setIsLoading(false);
            }
        }

        getIncidents();
    }, [priority]);

    return (
        <div className="flex justify-center p-6">
            <div className="w-full max-w-4xl space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Incidentes</CardTitle>
                        <CardDescription>
                            Visualizá y gestioná los incidentes de tu municipalidad.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Filtro por prioridad */}
                        <div className="flex justify-end">
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger className="w-48">
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

                        {/* Tabla */}
                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Título</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Prioridad</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="text-center text-sm text-muted-foreground py-8"
                                            >
                                                Cargando...
                                            </TableCell>
                                        </TableRow>
                                    ) : incidents.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="text-center text-sm text-muted-foreground py-8"
                                            >
                                                Sin incidentes.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        visibleIncidents
                                            .map((incident) => (
                                                <TableRow
                                                    key={incident.id}
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => navigate(APP_ROUTES.panel.incidentDetailPath(incident.id))}

                                                >
                                                    <TableCell className="font-medium">
                                                        {incident.title}
                                                    </TableCell>

                                                    <TableCell className="text-muted-foreground">
                                                        <span className="text-sm">
                                                            {STATUS_LABELS[incident.status]}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Badge
                                                            className={PRIORITY_STYLES[incident.priority]}
                                                        >
                                                            {PRIORITY_LABELS[incident.priority]}
                                                        </Badge>
                                                    </TableCell>

                                                    <TableCell className="text-muted-foreground">
                                                        {new Date(incident.createdAt).toLocaleDateString("es-AR")}
                                                    </TableCell>

                                                    <TableCell />
                                                </TableRow>
                                            ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                {visibleIncidents.length} incidente{visibleIncidents.length !== 1 ? "s" : ""}
                            </p>

                            <Button
                                variant="outline"
                                onClick={() => navigate(APP_ROUTES.panel.incidentHistory)}
                            >
                                Historial de incidentes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}