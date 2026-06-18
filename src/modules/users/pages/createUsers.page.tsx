import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/config/app.routes";

import { municipalitiesService } from "@/modules/municipalities/municipalities.service"
import type { Municipality } from "@/modules/municipalities/municipalities.type"
import { userService } from "../user.service"
import { USER_ROLES } from "@/config/const.globs"
import { useAuthUser } from "@/modules/auth/auth.context"
import { notify } from "@/lib/notify";

interface CreateUserForm {
  email: string
  municipalityId: string
}

const initialForm: CreateUserForm = {
  email: "",
  municipalityId: "",
}

export function CreateUsersPage() {
  const { user } = useAuthUser()

  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [form, setForm] = useState<CreateUserForm>(initialForm)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === USER_ROLES.SUPERADMIN
  const isAdmin = user?.role === USER_ROLES.ADMIN

  const config = useMemo(() => {
    if (isSuperAdmin) {
      return {
        title: "Crear administrador",
        description: "Completá los datos para invitar un nuevo administrador.",
        buttonText: "Crear admin",
        roleToCreate: USER_ROLES.ADMIN,
      }
    }

    if (isAdmin) {
      return {
        title: "Crear operador",
        description: "Completá el email para invitar un nuevo operador.",
        buttonText: "Crear operador",
        roleToCreate: USER_ROLES.OPERATOR,
      }
    }

    return null
  }, [isSuperAdmin, isAdmin])

  useEffect(() => {
    if (!isSuperAdmin) return

    async function getMunicipalities() {
      const response = await municipalitiesService.getMunicipalities()
      setMunicipalities(response)
    }

    getMunicipalities()
  }, [isSuperAdmin])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!config) return;

    try {
      setIsLoading(true);

      const municipalityId = isSuperAdmin
        ? form.municipalityId
        : user?.municipalityId;

      if (!municipalityId) {
        throw new Error("No se pudo resolver la municipalidad");
      }

      await notify.promise(
        userService.inviteUser({
          email: form.email,
          role: config.roleToCreate,
          municipalityId,
        }),
        {
          loading: "Creando usuario...",
          success: "Usuario creado correctamente.",
          error: "Error al crear el usuario.",
        }
      );

      setForm(initialForm);
      navigate(APP_ROUTES.panel.users);

    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel() {
    navigate(APP_ROUTES.panel.users)
  }

  if (!config) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Sin permisos</CardTitle>
            <CardDescription>
              No tenés permisos para crear usuarios.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>{config.title}</CardTitle>
          <CardDescription>{config.description}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="pb-4">
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="user-email">
                    Email del usuario
                  </FieldLabel>

                  <Input
                    id="user-email"
                    type="email"
                    placeholder="usuario@email.com"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </Field>

                {isSuperAdmin && (
                  <Field className="pb-2">
                    <FieldLabel htmlFor="user-municipality">
                      Municipalidad
                    </FieldLabel>

                    <Select
                      value={form.municipalityId}
                      required
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          municipalityId: value,
                        }))
                      }
                    >
                      <SelectTrigger id="user-municipality">
                        <SelectValue placeholder="Seleccionar municipalidad" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectGroup>
                          {municipalities.map((municipality) => (
                            <SelectItem
                              key={municipality.id}
                              value={municipality.id}
                            >
                              {municipality.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </FieldGroup>
            </FieldSet>
          </CardContent>

          <CardFooter className="flex gap-2 pt-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : config.buttonText}
            </Button>

            <Button
              variant="outline"
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}