import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchIcon, MoreHorizontalIcon } from "lucide-react";

import { userService } from "../user.service";

import { APP_ROUTES } from "@/config/app.routes";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const { user: authUser } = useAuthUser()

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [users, setUsers] = useState<GetUser[]>([]);
  const [operatorToDelete, setOperatorToDelete] = useState<GetUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const filtered = users.filter((user) => {
    
    const matchSearch =
      (user.name?.toLowerCase() ?? "").includes(search.toLowerCase()) ||
      (user.municipality?.name?.toLowerCase() ?? "").includes(search.toLowerCase());

    const matchStatus = status === "todos" || user.status === status;

    return matchSearch && matchStatus;
  });

  useEffect(() => {
    async function getUsers() {
      try {
        if (!authUser) return;

        if (authUser.role === "superadmin") {
          const response = await userService.getAdmins();
          setUsers(response);
          return;
        }

        if (authUser.role === "admin") {
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
  }, [authUser]);

  async function handleDeactivate() {
    if (!operatorToDelete) return;

    try {
      setIsDeleting(true);
      await userService.updateUserStatus(operatorToDelete.id, "inactive");
      setUsers((prev) =>
        prev.map((user) =>
          user.id === operatorToDelete.id
            ? { ...user, status: "inactive" }
            : user
        )
      ); setOperatorToDelete(null);
    } catch (error) {
      console.error("Error al eliminar operador:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex justify-center p-6">
      <div className="w-full max-w-3xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{authUser?.role === "admin" ? "Operadores" : "Usuarios"}</CardTitle>
            <CardDescription>
              {authUser?.role === "admin"
                ? "Administrá los operadores de tu municipalidad."
                : "Administrá los usuarios registrados en el sistema."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
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
                              <DropdownMenuItem onClick={() => navigate(APP_ROUTES.panel.operatorDetailPath(user.id))}>
                                Ver detalle
                              </DropdownMenuItem>
                              {authUser?.role !== "admin" && (
                                <DropdownMenuItem>Editar</DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setOperatorToDelete(user)}
                              >
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
              {filtered.length} {authUser?.role === "admin" ? "operador" : "usuario"}{filtered.length !== 1 ? "es" : ""}
            </p>
          </CardContent>
        </Card>

        <Dialog open={!!operatorToDelete} onOpenChange={() => setOperatorToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Estás seguro?</DialogTitle>
              <DialogDescription>
                El operador <strong>{operatorToDelete?.name ?? operatorToDelete?.email}</strong> será desactivado y no podrá acceder al sistema. El operador no será eliminado permanentemente y podrás reactivarlo si es necesario.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOperatorToDelete(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeactivate}
                disabled={isDeleting}
              >
                {isDeleting ? "Desactivando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}