import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";

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
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { useAuthUser } from "@/modules/auth/auth.context";
import type { GetUser, OperatorDetail } from "../user.types";
import { DialogOperatorDetail } from "@/components/dialog-operator-detail";

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
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [users, setUsers] = useState<GetUser[]>([]);

  // --- original ---
  const [operatorToDelete, setOperatorToDelete] = useState<GetUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- nuevo para admin ---
  const [selectedOperator, setSelectedOperator] = useState<OperatorDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

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

      const newStatus =
        operatorToDelete.status === "active"
          ? "inactive"
          : "active";

      await userService.updateUserStatus(
        operatorToDelete.id,
        newStatus
      );

      setUsers((prev) =>
        prev.map((user) =>
          user.id === operatorToDelete.id
            ? { ...user, status: newStatus }
            : user
        )
      );

      setOperatorToDelete(null);
    } catch (error) {
      console.error("Error al actualizar operador:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  // --- nuevo para admin ---
  async function handleOpenDetail(userId: string) {
    try {
      setIsLoadingDetail(true);
      setSelectedOperator(await userService.getOperatorById(userId));
    } catch (error) {
      console.error("Error al cargar operador:", error);
    } finally {
      setIsLoadingDetail(false);
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!authUser?.municipalityId) return;

    try {
      setIsCreating(true);
      setCreateError("");
      setCreateSuccess("");

      await userService.inviteUser({
        email: createEmail,
        role: "operator",
        municipalityId: authUser.municipalityId,
      });

      setCreateSuccess("Operador invitado correctamente.");
      setCreateEmail("");
      const response = await userService.getOperators();
      setUsers(response);
      setTimeout(() => { setIsCreateOpen(false); setCreateSuccess(""); }, 2000);
    } catch (error: any) {
      setCreateError(error?.response?.data?.message ?? "Error al crear el operador.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="flex justify-center p-6">
      <div className="w-full max-w-3xl space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{authUser?.role === "admin" ? "Operadores" : "Usuarios"}</CardTitle>
              <CardDescription>
                {authUser?.role === "admin"
                  ? "Administrá los operadores de tu municipalidad."
                  : "Administrá los usuarios registrados en el sistema."}
              </CardDescription>
            </div>

            {/* Botón crear — solo admin */}
            {authUser?.role === "admin" && (
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                <PlusIcon className="size-4 mr-1" />
                Crear operador
              </Button>
            )}
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
                      <TableRow
                        key={user.id}
                        onClick={authUser?.role === "admin" ? () => handleOpenDetail(user.id) : undefined}
                        className={authUser?.role === "admin" ? "cursor-pointer hover:bg-muted/50" : ""}
                      >
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
                          {/* Admin: botón directo — superadmin: dropdown original */}
                          {authUser?.role === "admin" ? (
                            <Button
                              size="sm"
                              className={
                                user.status === "active"
                                  ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                                  : "bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20"
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                setOperatorToDelete(user);
                              }}
                            >
                              {user.status === "active" ? "Desactivar" : "Activar"}
                            </Button>
                          ) : (
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
                                    navigate(APP_ROUTES.panel.operatorDetailPath(user.id))
                                  }
                                >
                                  Ver detalle
                                </DropdownMenuItem>

                                <DropdownMenuItem>
                                  Editar
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setOperatorToDelete(user)}
                                >
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
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

        {/* Dialog original — desactivar operador */}
        <Dialog open={!!operatorToDelete} onOpenChange={() => setOperatorToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Estás seguro?</DialogTitle>
              <DialogDescription>
                {operatorToDelete?.status === "active"
                  ? `El operador ${operatorToDelete?.name} será desactivado y no podrá acceder al sistema.`
                  : `El operador ${operatorToDelete?.name} volverá a estar habilitado para acceder al sistema.`}
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

        {/* Dialog detalle operador — solo admin */}
        <DialogOperatorDetail
          operator={selectedOperator}
          isLoading={isLoadingDetail}
          open={!!selectedOperator || isLoadingDetail}
          onOpenChange={(open) => !open && setSelectedOperator(null)}
        />

        {/* Dialog crear operador */}
        {authUser?.role === "admin" && (
          <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); setCreateError(""); setCreateSuccess(""); setCreateEmail(""); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear operador</DialogTitle>
                <DialogDescription>
                  Ingresá el email del nuevo operador. Recibirá una invitación para activar su cuenta.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreate}>
                <FieldSet>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="create-email">Email del operador</FieldLabel>
                      <Input
                        id="create-email"
                        type="email"
                        placeholder="operador@email.com"
                        required
                        value={createEmail}
                        onChange={(e) => setCreateEmail(e.target.value)}
                      />
                    </Field>
                  </FieldGroup>
                </FieldSet>

                {createError && <p className="text-sm text-destructive mt-2">{createError}</p>}
                {createSuccess && <p className="text-sm text-green-500 mt-2">{createSuccess}</p>}

                <DialogFooter className="mt-4">
                  <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creando..." : "Crear operador"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </div>
  );
}