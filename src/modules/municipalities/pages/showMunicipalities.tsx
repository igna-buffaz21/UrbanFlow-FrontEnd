import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MoreHorizontalIcon, SearchIcon } from "lucide-react";

import { municipalitiesService } from "../municipalities.service";

import { APP_ROUTES } from "@/config/app.routes";
import { notify } from "@/lib/notify";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { Municipality } from "../municipalities.type";
import { CreateMunicipality } from "./createMunicipalities";

export function ShowMunicipalitiesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateMunicipalityOpen, setIsCreateMunicipalityOpen] = useState(false);
  const [municipalityToToggle, setMunicipalityToToggle] = useState<Municipality | null>(null);
  const [togglingMunicipalityId, setTogglingMunicipalityId] = useState<string | null>(null);

  const filtered = municipalities.filter((municipality) => {
    const matchSearch = municipality.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchStatus =
      statusFilter === "all" || municipality.status === statusFilter;

    return matchSearch && matchStatus;
  });

  async function loadMunicipalities() {
    try {
      setIsLoading(true);
      const response = await municipalitiesService.getMunicipalities();
      setMunicipalities(response);
    } catch (error) {
      console.error("Error cargando municipios:", error);
      notify.error("No se pudieron cargar los municipios.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleMunicipalityStatus() {
    if (!municipalityToToggle) return;

    try {
      setTogglingMunicipalityId(municipalityToToggle.id);
      const updatedMunicipality = await municipalitiesService.toggleMunicipalityStatus(
        municipalityToToggle.id
      );

      setMunicipalities((currentMunicipalities) =>
        currentMunicipalities.map((municipality) =>
          municipality.id === updatedMunicipality.id
            ? updatedMunicipality
            : municipality
        )
      );
      notify.success(
        updatedMunicipality.status === "active"
          ? "Municipio activado correctamente."
          : "Municipio desactivado correctamente."
      );
      setMunicipalityToToggle(null);
    } catch (error) {
      console.error("Error cambiando estado del municipio:", error);
      notify.error("No se pudo cambiar el estado del municipio.");
    } finally {
      setTogglingMunicipalityId(null);
    }
  }

  useEffect(() => {
    loadMunicipalities();
  }, []);

  return (
    <div className="w-full space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Municipios</CardTitle>
                <CardDescription>
                  Administrá los municipios registrados en el sistema.
                </CardDescription>
              </div>

              <Button onClick={() => setIsCreateMunicipalityOpen(true)}>
                + Crear municipio
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar municipio..."
                  className="pl-8"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Municipio</TableHead>
                    <TableHead>Distrito</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        Cargando municipios...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        Sin resultados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((municipality) => (
                      <TableRow
                        key={municipality.id}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate(APP_ROUTES.panel.municipalityUsagePath(municipality.id))
                        }
                      >
                        <TableCell className="font-medium">
                          {municipality.name}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {municipality.district?.name ?? "Sin distrito"}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          <Badge
                            variant="outline"
                            className={
                              municipality.status === "active"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300"
                            }
                          >
                            {municipality.status === "active" ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>

                        <TableCell
                          className="text-right"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                              >
                                <MoreHorizontalIcon />
                                <span className="sr-only">Abrir menú</span>
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(APP_ROUTES.panel.municipalityUsagePath(municipality.id))
                                }
                              >
                                Ver uso mensual
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant={
                                  municipality.status === "active"
                                    ? "destructive"
                                    : undefined
                                }
                                disabled={togglingMunicipalityId === municipality.id}
                                onClick={() => setMunicipalityToToggle(municipality)}
                              >
                                {togglingMunicipalityId === municipality.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : null}
                                {municipality.status === "active"
                                  ? "Desactivar"
                                  : "Activar"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground">
              {filtered.length} municipio{filtered.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Dialog
          open={isCreateMunicipalityOpen}
          onOpenChange={setIsCreateMunicipalityOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear municipio</DialogTitle>
              <DialogDescription>
                Completá los datos para registrar una nueva municipalidad.
              </DialogDescription>
            </DialogHeader>

            <CreateMunicipality
              onCreated={() => {
                setIsCreateMunicipalityOpen(false);
                loadMunicipalities();
              }}
              onCancel={() => setIsCreateMunicipalityOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={Boolean(municipalityToToggle)}
          onOpenChange={(open) => {
            if (!open) setMunicipalityToToggle(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {municipalityToToggle?.status === "active"
                  ? "¿Desactivar municipio?"
                  : "¿Activar municipio?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {municipalityToToggle?.status === "active"
                  ? "El municipio quedará inactivo hasta que vuelvas a activarlo."
                  : "El municipio volverá a estar activo en el sistema."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={Boolean(togglingMunicipalityId)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                variant={
                  municipalityToToggle?.status === "active"
                    ? "destructive"
                    : "default"
                }
                disabled={Boolean(togglingMunicipalityId)}
                onClick={handleToggleMunicipalityStatus}
              >
                {togglingMunicipalityId ? "Guardando..." : "Confirmar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
