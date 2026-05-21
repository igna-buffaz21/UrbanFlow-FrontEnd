import { useEffect, useState } from "react";
import { SearchIcon, MoreHorizontalIcon } from "lucide-react";

import { userService } from "../user.service";

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
import { useAuthUser } from "@/modules/auth/auth.context";
import type { GetUser } from "../user.types";

type UserStatus = "active" | "inactive";

type User = {
  id: string;
  name: string;
  status: UserStatus;
  municipality: {
    id: string;
    name: string;
  };
};

export function ShowUsersPage() {
  const { user } = useAuthUser()

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [users, setUsers] = useState<GetUser[]>([]);
  

  const filtered = users.filter((user) => {
    const matchSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.municipality?.name.toLowerCase().includes(search.toLowerCase());

    const matchStatus = status === "todos" || user.status === status;

    return matchSearch && matchStatus;
  });

  useEffect(() => {
    async function getUsers() {
      try {
        if (!user) return;

        if (user.role === "superadmin") {
          const response = await userService.getAdmins();
          setUsers(response);
          return;
        }

        if (user.role === "admin") {
          const response = await userService.getOperators();
          setUsers(response);
          return;
        }

        setUsers([]);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        setUsers([]);
      }
    }

    getUsers();
  }, [user]);

  return (
    <div className="flex justify-center p-6">
      <div className="w-full max-w-3xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>
              Administrá los usuarios registrados en el sistema.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Filtros */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuario o municipio..."
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
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabla */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Municipio</TableHead>
                    <TableHead>Estado</TableHead>
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
                    filtered.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {user.municipality?.name}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {user.status === "active" ? "Activo" : "Inactivo"}
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
                              <DropdownMenuItem>Ver detalle</DropdownMenuItem>
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
              {filtered.length} usuario{filtered.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}