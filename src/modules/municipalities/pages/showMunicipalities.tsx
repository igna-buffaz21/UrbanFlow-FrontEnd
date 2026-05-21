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
import type { Municipality } from "../municipalities.type";

const MUNICIPIOS = [
  { id: 1, nombre: "Córdoba", provincia: "Córdoba" },
  { id: 2, nombre: "Rosario", provincia: "Santa Fe" },
  { id: 3, nombre: "Mendoza", provincia: "Mendoza" },
];

export function ShowMunicipalitiesPage() {
  const [search, setSearch] = useState("");
  const [provincia, setProvincia] = useState("todas");
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);

  const provincias = [...new Set(MUNICIPIOS.map((m) => m.provincia))];

  const filtered = municipalities.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchProvincia = provincia === "todas" || m.status === provincia;
    return matchSearch && matchProvincia;
  });

  useEffect(() => {
    async function loadMunicipalities() {
      const response = await municipalitiesService.getMunicipalities();
      setMunicipalities(response);
      console.log("Municipalities loaded:", response);
    }
    loadMunicipalities();
  }, []);

  return (
    <div className="flex justify-center p-6">
      <div className="w-full max-w-3xl space-y-4">
        {/* Card con la tabla de municipios */}
        <Card>
          <CardHeader>
            <CardTitle>Municipios</CardTitle>
            <CardDescription>
              Administrá los municipios registrados en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Filtros */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar municipio..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={provincia} onValueChange={setProvincia}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Provincia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las provincias</SelectItem>
                  {provincias.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tabla */}
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
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        Sin resultados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {m.status}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
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

      </div>
    </div>
  );
}