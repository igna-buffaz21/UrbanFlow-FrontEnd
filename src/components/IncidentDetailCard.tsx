import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Map,
    MapMarker,
    MarkerContent,
    MarkerTooltip,
    MarkerPopup,
} from "@/components/ui/map";
import type { AdminIncidentDetail } from "../modules/incidents/incidents.type"

const PRIORITY_LABELS: Record<string, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
    critical: "Crítica",
};

const PRIORITY_STYLES: Record<string, string> = {
    low: "bg-green-500 text-white hover:bg-green-600",
    medium: "bg-yellow-500 text-black hover:bg-yellow-600",
    high: "bg-red-500 text-white hover:bg-red-600",
    critical: "bg-purple-600 text-white hover:bg-purple-700",
};

const STATUS_LABELS: Record<string, string> = {
    in_review: "En revisión",
    open: "Abierto",
    assigned: "Asignado",
    resolved: "Resuelto",
    closed: "Cerrado",
    rejected: "Rechazado",
};

interface IncidentDetailCardProps {
    incident: AdminIncidentDetail;
    showMap?: boolean;
    showResolutionPhoto?: boolean;
    showAssignmentData?: boolean;
}

export function IncidentDetailCard({
    incident,
    showMap = false,
    showResolutionPhoto = true,
    showAssignmentData = true,
}: IncidentDetailCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{incident.title}</CardTitle>
                <CardDescription>{incident.description ?? "Sin descripción"}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">

                {incident.photoUrl && (
                    <div className="space-y-2">
                        <span className="text-sm font-medium">Foto del incidente</span>
                        <Dialog>
                            <DialogTrigger asChild>
                                <img
                                    src={incident.photoUrl}
                                    alt={incident.title}
                                    className="w-full max-h-80 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition"
                                />
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl p-2">
                                <img src={incident.photoUrl} alt={incident.title} className="w-full h-auto rounded-lg" />
                            </DialogContent>
                        </Dialog>
                    </div>
                )}

                {showResolutionPhoto &&
                    incident.resolutionPhotoUrl && (<div className="space-y-2">
                        <span className="text-sm font-medium">Foto de resolución del operador</span>
                        <Dialog>
                            <DialogTrigger asChild>
                                <img
                                    src={incident.resolutionPhotoUrl}
                                    alt="Resolución"
                                    className="w-full max-h-80 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition"
                                />
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl p-2">
                                <img src={incident.resolutionPhotoUrl} alt="Resolución" className="w-full h-auto rounded-lg" />
                            </DialogContent>
                        </Dialog>

                        {showMap && incident.location && (
                            <div className="space-y-2">
                                <span className="text-sm font-medium">
                                    Ubicación del incidente
                                </span>

                                <div className="h-80 overflow-hidden rounded-lg border">                                <Map center={incident.location.coordinates} zoom={16}>
                                    <MapMarker
                                        longitude={incident.location.coordinates[0]}
                                        latitude={incident.location.coordinates[1]}
                                    >
                                        <MarkerContent>
                                            <div className="bg-red-600 size-4 rounded-full border-2 border-white shadow-lg" />
                                        </MarkerContent>

                                        <MarkerTooltip>
                                            {incident.title}
                                        </MarkerTooltip>

                                        <MarkerPopup>
                                            <div>
                                                <p className="font-medium">
                                                    {incident.title}
                                                </p>
                                            </div>
                                        </MarkerPopup>
                                    </MapMarker>
                                </Map>
                                </div>
                            </div>
                        )}
                    </div>
                    )}

                <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Estado:</span>
                        <span className="text-sm">{STATUS_LABELS[incident.status] ?? incident.status}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Prioridad:</span>
                        <Badge className={PRIORITY_STYLES[incident.priority]}>
                            {PRIORITY_LABELS[incident.priority]}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Categoría:</span>
                        <span className="text-sm">{incident.category?.name ?? "Sin categoría"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Creado por:</span>
                        <span className="text-sm">{incident.createdBy?.name ?? "Sin datos"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Fecha de creación:</span>
                        <span className="text-sm">{new Date(incident.createdAt).toLocaleString("es-AR")}</span>
                    </div>

                    {showAssignmentData &&
                        incident.assignedTo && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Asignado a:
                                </span>
                                <span className="text-sm">
                                    {incident.assignedTo.name ?? "Sin datos"}
                                </span>
                            </div>
                        )}

                    {showAssignmentData &&
                        incident.assignedAt && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Fecha de asignación:
                                </span>
                                <span className="text-sm">
                                    {new Date(
                                        incident.assignedAt
                                    ).toLocaleString("es-AR")}
                                </span>
                            </div>
                        )}

                    {incident.resolvedAt && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Fecha de resolución:</span>
                            <span className="text-sm">{new Date(incident.resolvedAt).toLocaleString("es-AR")}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}