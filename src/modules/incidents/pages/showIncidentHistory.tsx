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
import { Button } from "@/components/ui/button";
import { incidentsService } from "../incidents.service";
import type { Incident, IncidentStatus } from "../incidents.type";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { IncidentDetailCard } from "@/components/IncidentDetailCard";
import type { AdminIncidentDetail } from "../incidents.type";
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

const LIMIT = 10;

export function ShowIncidentsHistoryPage() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [selectedIncident, setSelectedIncident] = useState<AdminIncidentDetail | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    async function fetchIncidents(pageToLoad: number, isLoadMore = false) {
        try {
            isLoadMore ? setIsLoadingMore(true) : setIsLoading(true);
            const response = await incidentsService.getClosedIncidentsHistory(pageToLoad, LIMIT);
            setTotal(response.total);
            setIncidents((prev) =>
                isLoadMore ? [...prev, ...response.data] : response.data
            );
        } catch (error) {
            console.error("Error loading history:", error);
            if (!isLoadMore) setIncidents([]);
        } finally {
            isLoadMore ? setIsLoadingMore(false) : setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchIncidents(1);
    }, []);

    function handleLoadMore() {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchIncidents(nextPage, true);
    }

    async function handleOpenDetail(id: string) {
        try {
            setIsLoadingDetail(true);
            setIsDetailOpen(true);
            const data = await incidentsService.getIncidentById(id);
            setSelectedIncident(data);
        } catch (error) {
            console.error("Error al cargar detalle:", error);
        } finally {
            setIsLoadingDetail(false);
        }
    }

    const hasMore = incidents.length < total;

    return (
        <div className="flex justify-center p-6">
            <div className="w-full max-w-4xl space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de incidentes</CardTitle>
                        <CardDescription>
                            Visualizá todos los incidentes cerrados y rechazados.
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
                                            <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                                                Cargando...
                                            </TableCell>
                                        </TableRow>
                                    ) : incidents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                                                No hay incidentes cerrados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        incidents.map((incident) => (
                                            <TableRow
                                                key={incident.id}
                                                className="cursor-pointer hover:bg-muted/50" // ← agregado
                                                onClick={() => handleOpenDetail(incident.id)} // ← agregado
                                            >
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
                                                    {new Date(
                                                        incident.closedAt ?? incident.createdAt
                                                    ).toLocaleDateString("es-AR")}
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

                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Mostrando {incidents.length} de {total} incidente{total !== 1 ? "s" : ""}
                            </p>
                            {hasMore && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore}
                                >
                                    {isLoadingMore ? "Cargando..." : "Ver más incidentes"}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDetailOpen} onOpenChange={(open) => { setIsDetailOpen(open); if (!open) setSelectedIncident(null); }}>
                <DialogContent className="!max-w-[800px] w-full max-h-[90vh] overflow-y-auto">
                    {isLoadingDetail ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p>
                    ) : selectedIncident ? (
                        <IncidentDetailCard
                            incident={selectedIncident}
                            showMap={true}
                            actions={
                                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                                    Cerrar
                                </Button>
                            }
                        />
                    ) : null}
                </DialogContent>
            </Dialog>

        </div>
    );
}