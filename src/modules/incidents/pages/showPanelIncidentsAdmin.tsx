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
import { incidentsService } from "../incidents.service";
import type { Incident } from "../incidents.type";
import { PRIORITY_LABELS, PRIORITY_STYLES, STATUS_LABELS } from "../incidents.constants";

export function ShowAdminIncidentsPage() {
    const navigate = useNavigate();

    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [priority, setPriority] = useState("all");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function getIncidents() {
            try {
                setIsLoading(true);

                const filters = priority !== "all" ? { priority } : undefined;
                const response = await incidentsService.getIncidents(filters);

                const activeIncidents = response.filter(
                    (incident) =>
                        incident.status !== "resolved" &&
                        incident.status !== "closed" &&
                        incident.status !== "rejected");

                setIncidents(activeIncidents);
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

                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Título</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Prioridad</TableHead>
                                        <TableHead>Fecha</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="text-center text-sm text-muted-foreground py-8"
                                            >
                                                Cargando...
                                            </TableCell>
                                        </TableRow>
                                    ) : incidents.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="text-center text-sm text-muted-foreground py-8"
                                            >
                                                Sin incidentes.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        incidents.map((incident) => (
                                            <TableRow
                                                key={incident.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() =>
                                                    navigate(APP_ROUTES.panel.incidentDetailPath(incident.id))
                                                }
                                            >
                                                <TableCell className="font-medium">
                                                    {incident.title}
                                                </TableCell>

                                                <TableCell className="text-muted-foreground">
                                                    {STATUS_LABELS[incident.status] ?? incident.status}
                                                </TableCell>

                                                <TableCell>
                                                    <Badge className={PRIORITY_STYLES[incident.priority]}>
                                                        {PRIORITY_LABELS[incident.priority] ?? incident.priority}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="text-muted-foreground">
                                                    {new Date(incident.createdAt).toLocaleDateString("es-AR")}
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
