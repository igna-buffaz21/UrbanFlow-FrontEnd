import { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    MessageCircle,
    UserCheck,
    UserX,
    SearchIcon,
    IdCard,
    Phone,
    MapPin,
    Building2,
    Map,
    Home,
    Mail,
    CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { notify } from "@/lib/notify";
import { userService } from "../user.service";
import type { CitizenDetail, GetCitizen } from "../user.types";

const STATUS_LABELS: Record<string, string> = {
    active: "Activo",
    blocked: "Bloqueado",
};

export function ShowCitizensPage() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("todos");
    const [citizens, setCitizens] = useState<GetCitizen[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false); const [citizenToUpdate, setCitizenToUpdate] = useState<GetCitizen | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const [selectedCitizen, setSelectedCitizen] = useState<CitizenDetail | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    const LIMIT = 10;

    useEffect(() => {
        loadCitizens(1);
    }, []);

    async function loadCitizens(pageToLoad: number, isLoadMore = false) {
        try {
            isLoadMore ? setIsLoadingMore(true) : null;
            const response = await userService.getCitizens(pageToLoad, LIMIT);
            setTotal(response.total);
            setCitizens((prev) =>
                isLoadMore ? [...prev, ...response.data] : response.data
            );
        } catch (error) {
            console.error("Error al cargar usuarios:", error);
            if (!isLoadMore) setCitizens([]);
        } finally {
            isLoadMore ? setIsLoadingMore(false) : null;
        }
    }

    function handleLoadMore() {
        const nextPage = page + 1;
        setPage(nextPage);
        loadCitizens(nextPage, true);
    }

    const filtered = citizens.filter((citizen) => {
        const normalizedSearch = search.toLowerCase();

        const matchSearch =
            (citizen.name?.toLowerCase() ?? "").includes(normalizedSearch) ||
            (citizen.email?.toLowerCase() ?? "").includes(normalizedSearch);

        const matchStatus = status === "todos" || citizen.status === status;

        return matchSearch && matchStatus;
    });

    async function handleUpdateStatus() {
        if (!citizenToUpdate?.id) return;

        try {
            setIsUpdating(true);
            const newStatus = citizenToUpdate.status === "blocked" ? "active" : "blocked";

            await userService.updateUserStatus(citizenToUpdate.id, newStatus);

            setCitizens((prev) =>
                prev.map((citizen) =>
                    citizen.id === citizenToUpdate.id
                        ? { ...citizen, status: newStatus }
                        : citizen
                )
            );

            notify.success(
                newStatus === "blocked"
                    ? "Usuraio bloqueado correctamente."
                    : "Usuraio desbloqueado correctamente."
            );

            setCitizenToUpdate(null);
        } catch (error: any) {
            console.error("Error al actualizar usuario:", error);
            notify.error(
                error?.response?.data?.message ?? "Error al actualizar el usuario."
            );
        } finally {
            setIsUpdating(false);
        }
    }

    async function handleOpenDetail(id: string | undefined) {
        if (!id) return;

        try {
            setIsLoadingDetail(true);
            setIsDetailOpen(true);
            const data = await userService.getCitizenById(id);
            setSelectedCitizen(data);
        } catch (error) {
            console.error("Error al cargar detalle del usuario:", error);
        } finally {
            setIsLoadingDetail(false);
        }
    }

    return (
        <div className="flex justify-center p-6">
            <div className="w-full max-w-3xl space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Usuarios</CardTitle>
                        <CardDescription>
                            Administrá los usuarios registrados en la app.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nombre o email..."
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos los estados</SelectItem>
                                    <SelectItem value="active">Activo</SelectItem>
                                    <SelectItem value="blocked">Bloqueado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Registrado</TableHead>
                                        <TableHead>WhatsApp</TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {filtered.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="text-center text-sm text-muted-foreground py-8"
                                            >
                                                Sin resultados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filtered.map((citizen) => (
                                            <TableRow
                                                key={citizen.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => handleOpenDetail(citizen.id)}                                            >
                                                <TableCell className="font-medium">
                                                    {citizen.name || citizen.email}
                                                </TableCell>

                                                <TableCell className="text-muted-foreground">
                                                    {STATUS_LABELS[citizen.status] ?? citizen.status}
                                                </TableCell>

                                                <TableCell className="text-muted-foreground">
                                                    {citizen.createdAt
                                                        ? new Date(citizen.createdAt).toLocaleDateString("es-AR")
                                                        : "-"}
                                                </TableCell>

                                                <TableCell>
                                                    {citizen.phone ? (
                                                        <a
                                                            href={`https://wa.me/${citizen.phone}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="inline-flex items-center justify-center size-8 rounded-md text-green-600 hover:bg-green-600/10 transition-colors"
                                                        >
                                                            <MessageCircle className="size-4" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">Sin teléfono</span>
                                                    )}
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        className={
                                                            citizen.status === "blocked"
                                                                ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20"
                                                                : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                                                        }
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCitizenToUpdate(citizen);
                                                        }}
                                                    >
                                                        {citizen.status === "blocked" ? (
                                                            <UserCheck className="size-4" />
                                                        ) : (
                                                            <UserX className="size-4" />
                                                        )}
                                                        {citizen.status === "blocked" ? "Desbloquear" : "Bloquear"}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Mostrando {citizens.length} de {total} usuario/s{total !== 1 ? "s" : ""}
                            </p>
                            {citizens.length < total && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore}
                                >
                                    {isLoadingMore ? "Cargando..." : "Ver más Usuarios"}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={!!citizenToUpdate} onOpenChange={() => setCitizenToUpdate(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>¿Estás seguro?</DialogTitle>
                            <DialogDescription>
                                {citizenToUpdate?.status === "blocked"
                                    ? `${citizenToUpdate?.name || citizenToUpdate?.email} volverá a tener acceso a la app.`
                                    : `${citizenToUpdate?.name || citizenToUpdate?.email} será bloqueado y no podrá usar la app.`}
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setCitizenToUpdate(null)}
                                disabled={isUpdating}
                            >
                                Cancelar
                            </Button>
                            <Button
                                className={
                                    citizenToUpdate?.status === "blocked"
                                        ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20"
                                        : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                                }
                                onClick={handleUpdateStatus}
                                disabled={isUpdating}
                            >
                                {isUpdating ? "Guardando..." : "Confirmar"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={isDetailOpen}
                    onOpenChange={(open) => {
                        setIsDetailOpen(open);
                        if (!open) setSelectedCitizen(null);
                    }}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Detalle del usuario</DialogTitle>
                        </DialogHeader>

                        {isLoadingDetail ? (
                            <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p>
                        ) : selectedCitizen ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="size-12">
                                        <AvatarImage src={selectedCitizen.photoUrl ?? undefined} />
                                        <AvatarFallback>
                                            {(selectedCitizen.name ?? selectedCitizen.email).charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="font-semibold truncate">{selectedCitizen.name ?? "Sin nombre"}</p>
                                        <p className="text-xs text-muted-foreground truncate">{selectedCitizen.email}</p>
                                    </div>
                                    <Badge
                                        className={
                                            selectedCitizen.status === "blocked"
                                                ? "ml-auto bg-red-500/10 text-red-500 border border-red-500/20"
                                                : "ml-auto bg-green-500/10 text-green-500 border border-green-500/20"
                                        }
                                    >
                                        {STATUS_LABELS[selectedCitizen.status] ?? selectedCitizen.status}
                                    </Badge>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <IdCard className="size-4" />
                                        <span>DNI</span>
                                    </div>
                                    <p className="font-medium">{selectedCitizen.dni ?? "Sin DNI"}</p>

                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="size-4" />
                                        <span>Teléfono</span>
                                    </div>
                                    <p className="font-medium">{selectedCitizen.phone ?? "Sin teléfono"}</p>

                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="size-4" />
                                        <span>Dirección</span>
                                    </div>
                                    <p className="font-medium">{selectedCitizen.address ?? "Sin dirección"}</p>

                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Building2 className="size-4" />
                                        <span>Ciudad</span>
                                    </div>
                                    <p className="font-medium">{selectedCitizen.city ?? "-"}</p>

                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Map className="size-4" />
                                        <span>Provincia</span>
                                    </div>
                                    <p className="font-medium">{selectedCitizen.province ?? "-"}</p>

                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Home className="size-4" />
                                        <span>Barrio</span>
                                    </div>
                                    <p className="font-medium">{selectedCitizen.subDistrict ?? "-"}</p>

                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="size-4" />
                                        <span>Código postal</span>
                                    </div>
                                    <p className="font-medium">{selectedCitizen.postalCode ?? "-"}</p>

                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CalendarDays className="size-4" />
                                        <span>Registrado</span>
                                    </div>
                                    <p className="font-medium">
                                        {new Date(selectedCitizen.createdAt).toLocaleDateString("es-AR")}
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                                Cerrar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div >
    );
}