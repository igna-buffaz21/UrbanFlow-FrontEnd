import { useEffect, useState } from "react";
import { SearchIcon, PlusIcon } from "lucide-react";

import { userService } from "../user.service";
import { municipalitiesService } from "@/modules/municipalities/municipalities.service";

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
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { useAuthUser } from "@/modules/auth/auth.context";
import type { GetUser } from "../user.types";
import type { Municipality } from "@/modules/municipalities/municipalities.type";

export function ShowUsersPage() {
  const { user: authUser } = useAuthUser();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [users, setUsers] = useState<GetUser[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);

  const [userToUpdate, setUserToUpdate] = useState<GetUser | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createMunicipalityId, setCreateMunicipalityId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  const isSuperAdmin = authUser?.role === "superadmin";
  const isAdmin = authUser?.role === "admin";

  const title = isSuperAdmin ? "Administradores" : "Operadores";
  const description = isSuperAdmin
    ? "Administrá los administradores del sistema."
    : "Administrá los operadores de tu municipalidad.";

  const createButtonText = isSuperAdmin ? "Crear administrador" : "Crear operador";
  const userLabel = isSuperAdmin ? "administrador" : "operador";

  const filtered = users.filter((user) => {
    const matchSearch =
      (user.name?.toLowerCase() ?? "").includes(search.toLowerCase()) ||
      (user.email?.toLowerCase() ?? "").includes(search.toLowerCase()) ||
      (user.municipality?.name?.toLowerCase() ?? "").includes(search.toLowerCase());

    const matchStatus = status === "todos" || user.status === status;

    return matchSearch && matchStatus;
  });

  useEffect(() => {
    loadUsers();
  }, [authUser]);

  useEffect(() => {
    if (!isSuperAdmin) return;

    async function loadMunicipalities() {
      try {
        const response = await municipalitiesService.getMunicipalities();
        setMunicipalities(response);
      } catch (error) {
        console.error("Error al cargar municipios:", error);
      }
    }

    loadMunicipalities();
  }, [isSuperAdmin]);

  async function loadUsers() {
    try {
      if (!authUser) return;

      if (isSuperAdmin) {
        const response = await userService.getAdmins();
        setUsers(response);
        return;
      }

      if (isAdmin) {
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

  async function handleUpdateStatus() {
    if (!userToUpdate) return;

    try {
      setIsUpdating(true);

      const newStatus = userToUpdate.status === "active" ? "inactive" : "active";

      await userService.updateUserStatus(userToUpdate.id, newStatus);

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userToUpdate.id ? { ...user, status: newStatus } : user
        )
      );

      setUserToUpdate(null);
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setIsCreating(true);
      setCreateError("");
      setCreateSuccess("");

      const municipalityId = isSuperAdmin
        ? createMunicipalityId
        : authUser?.municipalityId;

      if (!municipalityId) {
        setCreateError("Tenés que seleccionar un municipio.");
        return;
      }

      await userService.inviteUser({
        email: createEmail,
        role: isSuperAdmin ? "admin" : "operator",
        municipalityId,
      });

      setCreateSuccess(`${isSuperAdmin ? "Administrador" : "Operador"} invitado correctamente.`);
      setCreateEmail("");
      setCreateMunicipalityId("");

      await loadUsers();

      setTimeout(() => {
        setIsCreateOpen(false);
        setCreateSuccess("");
      }, 1500);
    } catch (error: any) {
      setCreateError(
        error?.response?.data?.message ??
        `Error al crear el ${userLabel}.`
      );
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
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>

            {(isAdmin || isSuperAdmin) && (
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                <PlusIcon className="size-4 mr-1" />
                {createButtonText}
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
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name || user.email}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {user.municipality?.name ?? "Sin municipio"}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {user.status === "active" ? "Activo" : "Inactivo"}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={
                              user.status === "active"
                                ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                                : "text-green-500 hover:text-green-500 hover:bg-green-500/10"
                            }
                            onClick={() => setUserToUpdate(user)}
                          >
                            {user.status === "active" ? "Desactivar" : "Activar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground">
              {filtered.length} {userLabel}
              {filtered.length !== 1 ? "es" : ""}
            </p>
          </CardContent>
        </Card>

        <Dialog open={!!userToUpdate} onOpenChange={() => setUserToUpdate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Estás seguro?</DialogTitle>
              <DialogDescription>
                {userToUpdate?.status === "active"
                  ? `El ${userLabel} ${userToUpdate?.name || userToUpdate?.email} será desactivado.`
                  : `El ${userLabel} ${userToUpdate?.name || userToUpdate?.email} volverá a estar activo.`}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUserToUpdate(null)}
                disabled={isUpdating}
              >
                Cancelar
              </Button>

              <Button
                variant="destructive"
                onClick={handleUpdateStatus}
                disabled={isUpdating}
              >
                {isUpdating ? "Guardando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            setCreateError("");
            setCreateSuccess("");
            setCreateEmail("");
            setCreateMunicipalityId("");
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{createButtonText}</DialogTitle>
              <DialogDescription>
                Ingresá el email. Recibirá una invitación para activar su cuenta.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreate}>
              <FieldSet>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Email</FieldLabel>
                    <Input
                      type="email"
                      placeholder="usuario@email.com"
                      required
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                    />
                  </Field>

                  {isSuperAdmin && (
                    <Field>
                      <FieldLabel>Municipio</FieldLabel>
                      <Select
                        value={createMunicipalityId}
                        onValueChange={setCreateMunicipalityId}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar municipio" />
                        </SelectTrigger>

                        <SelectContent>
                          {municipalities.map((municipality) => (
                            <SelectItem
                              key={municipality.id}
                              value={municipality.id}
                            >
                              {municipality.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </FieldGroup>
              </FieldSet>

              {createError && (
                <p className="text-sm text-destructive mt-2">{createError}</p>
              )}

              {createSuccess && (
                <p className="text-sm text-green-500 mt-2">{createSuccess}</p>
              )}

              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creando..." : createButtonText}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}