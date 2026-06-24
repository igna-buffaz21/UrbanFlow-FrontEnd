import { useEffect, useState } from "react";
import { SearchIcon, MoreHorizontalIcon } from "lucide-react";

import { municipalitiesService } from "../municipalities.service";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { Municipality } from "../municipalities.type";
import { CreateMunicipality } from "./createMunicipalities";

const MUNICIPIOS = [
  { id: 1, nombre: "Córdoba", provincia: "Córdoba" },
  { id: 2, nombre: "Rosario", provincia: "Santa Fe" },
  { id: 3, nombre: "Mendoza", provincia: "Mendoza" },
];

export function ShowMunicipalitiesPage() {
  const [search, setSearch] = useState("");
  const [provincia, setProvincia] = useState("todas");
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [isCreateMunicipalityOpen, setIsCreateMunicipalityOpen] = useState(false);

  const provincias = [...new Set(MUNICIPIOS.map((m) => m.provincia))];

  const filtered = municipalities.filter((municipality) => {
    const matchSearch = municipality.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchProvincia =
      provincia === "todas" || municipality.status === provincia;

    return matchSearch && matchProvincia;
  });

  async function loadMunicipalities() {
    const response = await municipalitiesService.getMunicipalities();
    setMunicipalities(response);
  }

  useEffect(() => {
    loadMunicipalities();
  }, []);

  return (
    <div className="flex justify-center p-6">
      <div className="w-full max-w-3xl space-y-4">
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
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar municipio..."
                  className="pl-8"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <Select value={provincia} onValueChange={setProvincia}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Provincia" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="todas">Todas las provincias</SelectItem>
                  {provincias.map((provincia) => (
                    <SelectItem key={provincia} value={provincia}>
                      {provincia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Municipio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        Sin resultados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((municipality) => (
                      <TableRow key={municipality.id}>
                        <TableCell className="font-medium">
                          {municipality.name}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {municipality.status}
                        </TableCell>

                        <TableCell className="text-right">
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
                              <DropdownMenuItem>Editar</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive">
                                Eliminar
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
      </div>
    </div>
  );
}