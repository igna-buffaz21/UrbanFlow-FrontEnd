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
import type { Incident } from "../incidents.type";
import { PRIORITY_LABELS, PRIORITY_STYLES } from "../incidents.constants";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ResolvedIncidentDetail } from "../pages/resolvedIncidentDetail";
export function ShowResolvedIncidentsPage() {

    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    async function fetchIncidents() {
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

    useEffect(() => {
        fetchIncidents();
    }, []);

    return (
        <div className="w-full p-6">
            <div className="w-full space-y-4">
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
                                                onClick={() => {
                                                    setSelectedId(incident.id); setIsDetailOpen(true);
                                                }
                                                }
                                            >
                                                <TableCell className="font-medium">
                                                    {incident.title}
                                                </TableCell>

                                                <TableCell>
                                                    <Badge className={PRIORITY_STYLES[incident.priority]}>
                                                        {PRIORITY_LABELS[incident.priority] ?? incident.priority}
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
            <Dialog open={isDetailOpen} onOpenChange={(open) => { setIsDetailOpen(open); if (!open) setSelectedId(null); }}>
                <DialogContent className="!max-w-[800px] w-full max-h-[90vh] overflow-y-auto">
                    {selectedId && (
                        <ResolvedIncidentDetail
                            id={selectedId}
                            onClose={() => { setIsDetailOpen(false); setSelectedId(null); setTimeout(() => fetchIncidents(), 500); }} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
