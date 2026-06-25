import React from "react";
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
import {
    Tag,
    User,
    UserCheck,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    ExternalLink,
    type LucideIcon,
} from "lucide-react";
import type { IncidentDetailResponse, AdminIncidentDetail } from "../modules/incidents/incidents.type"
import { PRIORITY_LABELS, PRIORITY_STYLES, STATUS_LABELS } from "../modules/incidents/incidents.constants";

interface IncidentDetailCardProps {
    incident: AdminIncidentDetail | IncidentDetailResponse;
    showMap?: boolean;
    showResolutionPhoto?: boolean;
    showAssignmentData?: boolean;
    actions?: React.ReactNode;
}

function DetailItem({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-2.5 rounded-lg border bg-muted/30 p-3">
            <Icon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                </p>
                <p className="text-sm font-medium truncate">{value}</p>
            </div>
        </div>
    );
}

export function IncidentDetailCard({
    incident,
    showMap = false,
    showResolutionPhoto = true,
    showAssignmentData = true,
    actions,
}: IncidentDetailCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                        <CardTitle className="text-xl">{incident.title}</CardTitle>
                        <CardDescription>{incident.description ?? "Sin descripción"}</CardDescription>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge variant="outline">
                            {STATUS_LABELS[incident.status] ?? incident.status}
                        </Badge>
                        <Badge className={PRIORITY_STYLES[incident.priority]}>
                            {PRIORITY_LABELS[incident.priority]}
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-5">

                {incident.photoUrl && (
                    <div className="space-y-2">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Foto del incidente
                        </span>
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

                {showMap && incident.location && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Ubicación del incidente
                            </span>
                            <a
                                href={`https://www.google.com/maps?q=${incident.location.coordinates[1]},${incident.location.coordinates[0]}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                                Ver en Google Maps
                                <ExternalLink className="size-3" />
                            </a>
                        </div>
                        <div className="h-80 overflow-hidden rounded-lg border">
                            <Map center={incident.location.coordinates} zoom={16}>
                                <MapMarker
                                    longitude={incident.location.coordinates[0]}
                                    latitude={incident.location.coordinates[1]}
                                >
                                    <MarkerContent>
                                        <div className="bg-red-600 size-4 rounded-full border-2 border-white shadow-lg" />
                                    </MarkerContent>
                                    <MarkerTooltip>{incident.title}</MarkerTooltip>
                                    <MarkerPopup>
                                        <div><p className="font-medium">{incident.title}</p></div>
                                    </MarkerPopup>
                                </MapMarker>
                            </Map>
                        </div>
                    </div>
                )}

                {showResolutionPhoto &&
                    incident.resolutionPhotoUrl && (
                        <div className="space-y-2">
                            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Foto de resolución del operador
                            </span>
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
                        </div>
                    )}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailItem
                        icon={Tag}
                        label="Categoría"
                        value={incident.category?.name ?? "Sin categoría"}
                    />

                    <DetailItem
                        icon={User}
                        label="Creado por"
                        value={incident.createdBy?.name ?? "Sin datos"}
                    />

                    <DetailItem
                        icon={Calendar}
                        label="Fecha de creación"
                        value={new Date(incident.createdAt).toLocaleString("es-AR")}
                    />

                    {showAssignmentData && incident.assignedTo && (
                        <DetailItem
                            icon={UserCheck}
                            label="Asignado a"
                            value={incident.assignedTo.name ?? "Sin datos"}
                        />
                    )}

                    {showAssignmentData && incident.assignedAt && (
                        <DetailItem
                            icon={Clock}
                            label="Fecha de asignación"
                            value={new Date(incident.assignedAt).toLocaleString("es-AR")}
                        />
                    )}

                    {incident.resolvedAt && (
                        <DetailItem
                            icon={CheckCircle2}
                            label="Fecha de resolución"
                            value={new Date(incident.resolvedAt).toLocaleString("es-AR")}
                        />
                    )}
                </div>

                {incident.status === "rejected" && incident.rejectionReason && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                        <div className="flex items-center gap-2 text-destructive">
                            <XCircle className="size-4" />
                            <span className="text-[11px] font-medium uppercase tracking-wide">
                                Motivo de rechazo
                            </span>
                        </div>
                        <p className="text-sm">{incident.rejectionReason}</p>
                        {incident.rejectedBy && (
                            <p className="text-xs text-muted-foreground">
                                Rechazado por {incident.rejectedBy.name}
                            </p>
                        )}
                    </div>
                )}

                {actions && (
                    <div className="flex gap-2 pt-2">
                        {actions}
                    </div>
                )}
            </CardContent>
        </Card >
    );
}