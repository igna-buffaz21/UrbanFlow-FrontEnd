import { useEffect, useState, useMemo } from "react";
import { incidentsService } from "../incidents.service";
import { userService } from "@/modules/users/user.service";
import type { Incident, AdminIncidentDetail } from "../incidents.type";
import type { GetUser } from "@/modules/users/user.types";
import { IncidentDetailCard } from "@/components/IncidentDetailCard";
import {
    Map,
    MapControls,
    MapMarker,
    MarkerContent,
    MarkerTooltip,
    MarkerPopup,
} from "@/components/ui/map";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TriangleAlert, UserCheck, UserX, Trash2 } from "lucide-react";
import { notify } from "@/lib/notify";
import { districtsService } from "@/modules/districts/district.service";
import centerOfMass from "@turf/center-of-mass";
import { PRIORITY_LABELS, PRIORITY_STYLES, STATUS_LABELS } from "../incidents.constants";
import {
    Dialog as ConfirmDialog,
    DialogContent as ConfirmDialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const PRIORITY_MARKER_STYLES: Record<string, { bg: string; pulse: string }> = {
    low: { bg: "bg-blue-400", pulse: "bg-blue-300/20" },
    medium: { bg: "bg-yellow-500", pulse: "bg-yellow-400/20" },
    high: { bg: "bg-orange-500", pulse: "bg-orange-400/25" },
};

function IncidentMarkerIcon({ priority }: { priority: string }) {
    const styles = PRIORITY_MARKER_STYLES[priority] ?? PRIORITY_MARKER_STYLES.medium;
    return (
        <div className="relative flex items-center justify-center">
            {priority === "high" && (
                <div className={`absolute size-8 rounded-full animate-ping ${styles.pulse}`} />
            )}
            <div className="relative flex flex-col items-center">
                <div className={`relative z-10 flex size-7 items-center justify-center rounded-full border border-white shadow-md ${styles.bg}`}>
                    <TriangleAlert className="size-3.5 text-white" strokeWidth={2.5} />
                </div>
                <div className={`-mt-1 size-2 rotate-45 border-r border-b border-white shadow-sm ${styles.bg}`} />
            </div>
        </div>
    );
}

export function AdminIncidentMapPage() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedIncident, setSelectedIncident] = useState<AdminIncidentDetail | null>(null);
    const [operators, setOperators] = useState<GetUser[]>([]);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isUnassigning, setIsUnassigning] = useState(false);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const [incidentsData, district] = await Promise.all([
                    incidentsService.getIncidents({ status: "open" }),
                    districtsService.getMyDistrict(),
                ]);
                setIncidents(incidentsData);

                if (district?.polygon) {
                    const centroid = centerOfMass({
                        type: "Feature",
                        properties: {},
                        geometry: district.polygon as GeoJSON.Polygon | GeoJSON.MultiPolygon,
                    });
                    const [lng, lat] = centroid.geometry.coordinates as [number, number];
                    setMapCenter([lng, lat]);
                }
            } catch (err) {
                console.error("Error cargando mapa de incidentes:", err);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const activeIncidents = useMemo(() =>
        incidents.filter(i =>
            i.location?.type === "Point" &&
            Array.isArray(i.location.coordinates) &&
            i.location.coordinates.length === 2
        ), [incidents]);

    async function openDetail(id: string) {
        setIsDetailOpen(true);
        setIsLoadingDetail(true);
        setSelectedOperatorId(null);
        try {
            const [detail, ops] = await Promise.all([
                incidentsService.getIncidentById(id),
                userService.getOperators(),
            ]);
            setSelectedIncident(detail);
            setOperators(ops.filter(op => op.status === "active"));
        } catch (err) {
            console.error("Error cargando detalle:", err);
        } finally {
            setIsLoadingDetail(false);
        }
    }

    function closeDetail() {
        setIsDetailOpen(false);
        setSelectedIncident(null);
        setSelectedOperatorId(null);
    }

    const canAssign = selectedIncident &&
        (selectedIncident.status === "open" || selectedIncident.status === "in_review") &&
        !selectedIncident.assignedTo;

    const canUnassign = selectedIncident?.status === "assigned";

    async function handleAssign() {
        if (!selectedIncident || !selectedOperatorId) return;
        try {
            setIsAssigning(true);
            await notify.promise(
                incidentsService.assignOperator(selectedIncident.id, selectedOperatorId),
                {
                    loading: "Asignando operador...",
                    success: "Operador asignado correctamente.",
                    error: "Error al asignar el operador.",
                }
            );
            setIncidents(prev => prev.filter(i => i.id !== selectedIncident.id));
            setIsAssignDialogOpen(false);
            closeDetail();
        } finally {
            setIsAssigning(false);
        }
    }

    async function handleReject() {
        if (!selectedIncident || !rejectionReason.trim()) return;
        try {
            setIsRejecting(true);
            await incidentsService.rejectIncident(selectedIncident.id, rejectionReason);
            notify.success("Incidente rechazado.");
            setIncidents(prev => prev.filter(i => i.id !== selectedIncident.id));
            setIsRejectDialogOpen(false);
            setRejectionReason("");
            closeDetail();
        } catch {
            notify.error("Error al rechazar el incidente.");
        } finally {
            setIsRejecting(false);
        }
    }

    async function handleUnassign() {
        if (!selectedIncident) return;
        try {
            setIsUnassigning(true);
            await notify.promise(
                incidentsService.unassignOperator(selectedIncident.id),
                {
                    loading: "Desasignando operador...",
                    success: "Operador desasignado correctamente.",
                    error: "Error al desasignar el operador.",
                }
            );
            setSelectedIncident(prev => prev ? { ...prev, status: "open", assignedTo: null } : prev);
            setIsUnassignDialogOpen(false);
        } finally {
            setIsUnassigning(false);
        }
    }

    const selectedOperator = operators.find(op => op.id === selectedOperatorId);

    return (
        <div className="p-6 space-y-4">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Mapa de incidentes</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Incidentes abiertos con ubicación registrada.
                </p>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle>Incidentes abiertos</CardTitle>
                    <CardDescription>
                        {activeIncidents.length} incidente{activeIncidents.length !== 1 ? "s" : ""} en estado abierto.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[calc(100vh-220px)] min-h-[480px] rounded-b-lg overflow-hidden">
                        {isLoading ? (
                            <div className="flex h-full items-center justify-center bg-muted/30">
                                <p className="text-sm text-muted-foreground">Cargando...</p>
                            </div>
                        ) : !mapCenter ? (
                            <div className="flex h-full items-center justify-center bg-muted/30">
                                <p className="text-sm text-muted-foreground">No se pudo obtener la ubicación del municipio.</p>
                            </div>
                        ) : activeIncidents.length === 0 ? (
                            <div className="flex h-full items-center justify-center bg-muted/30">
                                <p className="text-sm text-muted-foreground">Sin incidentes abiertos.</p>
                            </div>
                        ) : (
                            <Map center={mapCenter} zoom={13}>
                                <MapControls showRecenter recenterCenter={mapCenter} recenterZoom={13} />
                                {activeIncidents.map(incident => {
                                    const [lng, lat] = incident.location!.coordinates;
                                    return (
                                        <MapMarker key={incident.id} longitude={lng} latitude={lat}>
                                            <MarkerContent>
                                                <IncidentMarkerIcon priority={incident.priority} />
                                            </MarkerContent>
                                            <MarkerTooltip>{incident.title}</MarkerTooltip>
                                            <MarkerPopup>
                                                <div className="max-w-[220px] space-y-3">
                                                    <p className="text-sm font-semibold break-words">{incident.title}</p>
                                                    <div className="space-y-1 text-xs text-muted-foreground">
                                                        <p>Prioridad: <span className="font-medium text-foreground">{PRIORITY_LABELS[incident.priority] ?? incident.priority}</span></p>
                                                        <p>Estado: <span className="font-medium text-foreground">{STATUS_LABELS[incident.status] ?? incident.status}</span></p>
                                                    </div>
                                                    <Button type="button" size="sm" className="w-full" onClick={() => openDetail(incident.id)}>
                                                        Ver detalle
                                                    </Button>
                                                </div>
                                            </MarkerPopup>
                                        </MapMarker>
                                    );
                                })}
                            </Map>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Dialog — Detalle + asignación */}
            <Dialog open={isDetailOpen} onOpenChange={(open) => { if (!open) closeDetail(); }}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    {isLoadingDetail || !selectedIncident ? (
                        <div className="h-40 flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">Cargando...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <IncidentDetailCard
                                incident={selectedIncident}
                                showMap
                                showResolutionPhoto
                                showAssignmentData
                                actions={
                                    canAssign ? (
                                        <Button
                                            variant="outline"
                                            className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => setIsRejectDialogOpen(true)}
                                        >
                                            <Trash2 className="size-4" />
                                            Rechazar incidente
                                        </Button>
                                    ) : canUnassign ? (
                                        <Button
                                            variant="outline"
                                            className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => setIsUnassignDialogOpen(true)}
                                        >
                                            <UserX className="size-4" />
                                            Cancelar asignación
                                        </Button>
                                    ) : null
                                }
                            />

                            {canAssign && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Operadores</CardTitle>
                                        <CardDescription>
                                            Seleccioná un operador para asignarle este incidente.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {operators.map(operator => (
                                            <div
                                                key={operator.id}
                                                onClick={() => setSelectedOperatorId(operator.id)}
                                                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${selectedOperatorId === operator.id
                                                    ? "border-primary bg-primary/10"
                                                    : "hover:bg-muted/50"
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    readOnly
                                                    checked={selectedOperatorId === operator.id}
                                                    className="accent-primary"
                                                />
                                                <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-medium truncate">{operator.name}</span>
                                                        <span className="text-xs text-muted-foreground truncate">{operator.email}</span>
                                                    </div>
                                                    <Badge variant="default" className="shrink-0">Disponible</Badge>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-4">
                                            <Button
                                                className="bg-green-600/10 text-green-600 border border-green-600/30 hover:bg-green-600/20 hover:text-green-600"
                                                onClick={() => setIsAssignDialogOpen(true)}
                                                disabled={!selectedOperatorId || isAssigning}
                                            >
                                                <UserCheck className="size-4" />
                                                {isAssigning ? "Asignando..." : "Confirmar asignación"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog — Confirmar asignación */}
            <ConfirmDialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <ConfirmDialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Asignar operador?</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro que querés asignar a {selectedOperator?.name ?? "este operador"} a este incidente?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancelar</Button>
                        <Button
                            className="bg-green-600/10 text-green-600 border border-green-600/30 hover:bg-green-600/20 hover:text-green-600"
                            onClick={() => { setIsAssignDialogOpen(false); handleAssign(); }}
                            disabled={isAssigning}
                        >
                            {isAssigning ? "Asignando..." : "Confirmar"}
                        </Button>
                    </DialogFooter>
                </ConfirmDialogContent>
            </ConfirmDialog>

            {/* Dialog — Rechazar */}
            <ConfirmDialog open={isRejectDialogOpen} onOpenChange={(open) => { setIsRejectDialogOpen(open); if (!open) setRejectionReason(""); }}>
                <ConfirmDialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Rechazar incidente?</DialogTitle>
                        <DialogDescription>Explicá el motivo del rechazo. El ciudadano podrá verlo.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 pt-2">
                        <label className="text-sm font-medium text-muted-foreground">Motivo de rechazo (obligatorio)</label>
                        <textarea
                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                            placeholder="Ej: El incidente no corresponde a la vía pública..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsRejectDialogOpen(false); setRejectionReason(""); }}>Cancelar</Button>
                        <Button
                            variant="outline"
                            className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                            onClick={handleReject}
                            disabled={isRejecting || !rejectionReason.trim()}
                        >
                            {isRejecting ? "Rechazando..." : "Confirmar rechazo"}
                        </Button>
                    </DialogFooter>
                </ConfirmDialogContent>
            </ConfirmDialog>

            {/* Dialog — Cancelar asignación */}
            <ConfirmDialog open={isUnassignDialogOpen} onOpenChange={setIsUnassignDialogOpen}>
                <ConfirmDialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Cancelar asignación?</DialogTitle>
                        <DialogDescription>El incidente volverá a estado abierto y quedará sin operador asignado.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUnassignDialogOpen(false)}>Cancelar</Button>
                        <Button
                            variant="outline"
                            className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                            onClick={handleUnassign}
                            disabled={isUnassigning}
                        >
                            {isUnassigning ? "Desasignando..." : "Confirmar"}
                        </Button>
                    </DialogFooter>
                </ConfirmDialogContent>
            </ConfirmDialog>
        </div>
    );
}