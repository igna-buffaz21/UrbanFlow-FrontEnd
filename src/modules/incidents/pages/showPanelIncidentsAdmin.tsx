import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/config/app.routes";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { IncidentDetailResponse } from "../incidents.type";

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
    const [codeSearch, setCodeSearch] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<IncidentDetailResponse | null>(null);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

    async function handleCodeSearch() {
        if (!codeSearch.trim()) return;
        setIsSearching(true);
        setSearchError(null);
        try {
            const result = await incidentsService.getDetailByPublicCode(`INC-${codeSearch.trim()}`); setSearchResult(result);
            setIsSearchDialogOpen(true);
        } catch {
            setSearchError("No se encontró ningún incidente con ese código.");
            setSearchResult(null);
        } finally {
            setIsSearching(false);
        }
    }

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
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <CardTitle>Incidentes</CardTitle>
                                <CardDescription>
                                    Visualizá y gestioná los incidentes de tu municipalidad.
                                </CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 pt-0.5">
                                <p className="text-xs font-medium text-muted-foreground">Buscar por código</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center border rounded-md h-8 px-2 gap-1 text-xs bg-background w-[160px]">
                                        <span className="text-muted-foreground select-none font-medium">INC-</span>
                                        <input
                                            placeholder="70936"
                                            value={codeSearch}
                                            onChange={(e) => { setCodeSearch(e.target.value.replace(/\D/g, "")); setSearchError(null); }}
                                            onKeyDown={(e) => e.key === "Enter" && handleCodeSearch()}
                                            className="flex-1 bg-transparent outline-none text-xs w-full"
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCodeSearch}
                                        disabled={isSearching || !codeSearch.trim()}
                                    >
                                        {isSearching ? "..." : <Search className="size-4" />}
                                    </Button>
                                </div>
                                {searchError && (
                                    <p className="text-xs text-destructive">{searchError}</p>
                                )}
                            </div>
                        </div>
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
            <Dialog open={isSearchDialogOpen} onOpenChange={(open) => { setIsSearchDialogOpen(open); if (!open) setSearchResult(null); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Incidente #{searchResult?.publicCode}</DialogTitle>
                        <DialogDescription>{searchResult?.title}</DialogDescription>
                    </DialogHeader>
                    {searchResult && (
                        <div className="space-y-4 text-sm">
                            <div className="flex gap-2 flex-wrap">
                                <Badge>{STATUS_LABELS[searchResult.status] ?? searchResult.status}</Badge>
                                <Badge className={PRIORITY_STYLES[searchResult.priority as keyof typeof PRIORITY_STYLES]}>                                    {PRIORITY_LABELS[searchResult.priority]}
                                </Badge>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Historial</p>
                                <div className="border-l-2 border-border pl-4 space-y-3">
                                    {[
                                        { label: "Creado", date: searchResult.createdAt, by: searchResult.createdBy?.name },
                                        { label: "Asignado", date: searchResult.assignedAt, by: searchResult.assignedTo?.name },
                                        { label: "En progreso", date: searchResult.startedAt },
                                        { label: "Resuelto", date: searchResult.resolvedAt },
                                        { label: "Cerrado", date: searchResult.closedAt },
                                        { label: "Rechazado", date: searchResult.rejectedAt, extra: searchResult.rejectionReason },
                                    ].filter(e => e.date).map((event, i) => (
                                        <div key={i} className="relative">
                                            <div className="absolute -left-[21px] top-1 size-2 rounded-full bg-primary" />
                                            <p className="font-medium text-foreground">{event.label}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(event.date!).toLocaleString("es-AR")}
                                                {event.by ? ` · ${event.by}` : ""}
                                            </p>
                                            {event.extra && (
                                                <p className="text-xs text-muted-foreground italic mt-0.5">"{event.extra}"</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {searchResult.category && (
                                <p className="text-xs text-muted-foreground">Categoría: {searchResult.category.name}</p>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => { setIsSearchDialogOpen(false); navigate(APP_ROUTES.panel.incidentDetailPath(searchResult!.id)); }}>
                            Ver detalle completo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
