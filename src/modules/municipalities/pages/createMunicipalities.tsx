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
import { districtsService } from "@/modules/districts/district.service"
import type { Disctrict } from "@/modules/districts/district.type"
import { useEffect, useState } from "react"
import { municipalitiesService } from "../municipalities.service"

interface CreateMunicipalityForm {
  name: string
  districtId: string
}

const initialForm: CreateMunicipalityForm = {
  name: "",
  districtId: "",
}

export function CreateMunicipality() {
  const [districts, setDistricts] = useState<Disctrict[]>([])
  const [form, setForm] = useState<CreateMunicipalityForm>(initialForm)

  useEffect(() => {
    async function getDistricts() {
      const response = await districtsService.getDistricts()
      setDistricts(response)
      console.log("Districts loaded:", response)
    }

    getDistricts()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    console.log("Data del formulario:", form)

    const response = await municipalitiesService.createMunicipality(form)

    console.log("Response from createMunicipality:", response)
  }

  function handleCancel() {
    setForm(initialForm)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Crear municipalidad</CardTitle>
          <CardDescription>
            Completá los datos para registrar una nueva municipalidad.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="pb-4">
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="municipality-name">
                    Nombre de la municipalidad
                  </FieldLabel>
                  <Input
                    id="municipality-name"
                    placeholder="Ej. Municipalidad de San Luis"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </Field>

                <Field className="pb-2">
                  <FieldLabel htmlFor="municipality-district">
                    Distrito
                  </FieldLabel>

                  <Select
                    value={form.districtId}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        districtId: value,
                      }))
                    }
                  >
                    <SelectTrigger id="municipality-district">
                      <SelectValue placeholder="Seleccionar distrito" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectGroup>
                        {districts.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </FieldSet>
          </CardContent>

          <CardFooter className="flex gap-2 pt-2">
            <Button type="submit">Crear</Button>

            <Button variant="outline" type="button" onClick={handleCancel}>
              Cancelar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}