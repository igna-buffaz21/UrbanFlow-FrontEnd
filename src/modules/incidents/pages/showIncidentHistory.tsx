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

const STATUS_LABELS: Record<string, string> = {
    resolved: "Resuelto",
    closed: "Cerrado",
};

export function ShowIncidentsHistoryPage() {
    const navigate = useNavigate();

    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [status, setStatus] = useState("all");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function getIncidents() {
            try {
                setIsLoading(true);

                const filters = status !== "all" ? { status } : undefined;
                const response = await incidentsService.getIncidents(filters);

                setIncidents(response);
            } catch (error) {
                console.error("Error al cargar historial:", error);
                setIncidents([]);
            } finally {
                setIsLoading(false);
            }
        }

        getIncidents();
    }, [status]);

    return (
        <div className="flex justify-center p-6">
            <div className="w-full max-w-4xl space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de incidentes</CardTitle>
                        <CardDescription>
                            Visualizá todos los incidentes resueltos y cerrados.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="flex justify-end">
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="resolved">Resueltos</SelectItem>
                                    <SelectItem value="closed">Cerrados</SelectItem>
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
                                            <TableRow key={incident.id}>
                                                <TableCell className="font-medium">
                                                    {incident.title}
                                                </TableCell>

                                                <TableCell className="text-muted-foreground">
                                                    {STATUS_LABELS[incident.status] ?? incident.status}
                                                </TableCell>

                                                <TableCell>
                                                    <Badge variant={PRIORITY_VARIANTS[incident.priority]}>
                                                        {PRIORITY_LABELS[incident.priority]}
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

                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                {incidents.length} incidente{incidents.length !== 1 ? "s" : ""}
                            </p>

                            <Button
                                variant="outline"
                                onClick={() => navigate(APP_ROUTES.panel.incidents)}
                            >
                                Volver a incidentes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}