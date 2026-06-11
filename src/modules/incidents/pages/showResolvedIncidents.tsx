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

export function ShowResolvedIncidentsPage() {
    const navigate = useNavigate();

    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function getIncidents() {
            try {
                setIsLoading(true);

                const response = await incidentsService.getIncidents({
                    status: "resolved",
                });

                setIncidents(response);
            } catch (error) {
                console.error("Error al cargar incidentes resueltos:", error);
                setIncidents([]);
            } finally {
                setIsLoading(false);
            }
        }

        getIncidents();
    }, []);

    return (
        <div className="flex justify-center p-6">
            <div className="w-full max-w-4xl space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Incidentes resueltos</CardTitle>
                        <CardDescription>
                            Revisá los incidentes resueltos por los operadores y cerrá o reasigná según corresponda.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Título</TableHead>
                                        <TableHead>Prioridad</TableHead>
                                        <TableHead>Fecha de resolución</TableHead>
                                        <TableHead>Operador</TableHead>
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
                                                Sin incidentes resueltos.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        incidents.map((incident) => (
                                            <TableRow
                                                key={incident.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() =>
                                                    navigate(APP_ROUTES.panel.incidentResolvedDetailPath(incident.id))
                                                }
                                            >
                                                <TableCell className="font-medium">
                                                    {incident.title}
                                                </TableCell>

                                                <TableCell>
                                                    <Badge variant={PRIORITY_VARIANTS[incident.priority]}>
                                                        {PRIORITY_LABELS[incident.priority]}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="text-muted-foreground">
                                                    {new Date(incident.resolvedAt ?? incident.createdAt).toLocaleDateString("es-AR")}
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