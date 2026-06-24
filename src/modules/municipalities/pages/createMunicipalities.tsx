import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { districtsService } from "@/modules/districts/district.service";
import type { Disctrict } from "@/modules/districts/district.type";
import { useEffect, useState } from "react";
import { municipalitiesService } from "../municipalities.service";

interface CreateMunicipalityForm {
  name: string;
  districtId: string;
}

interface CreateMunicipalityProps {
  onCreated?: () => void;
  onCancel?: () => void;
}

const initialForm: CreateMunicipalityForm = {
  name: "",
  districtId: "",
};

export function CreateMunicipality({
  onCreated,
  onCancel,
}: CreateMunicipalityProps) {
  const [districts, setDistricts] = useState<Disctrict[]>([]);
  const [form, setForm] = useState<CreateMunicipalityForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function getDistricts() {
      const response = await districtsService.getDistricts();
      setDistricts(response);
    }

    getDistricts();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("El nombre de la municipalidad es obligatorio");
      return;
    }

    if (!form.districtId) {
      alert("El distrito es obligatorio");
      return;
    }

    try {
      setIsSubmitting(true);

      await municipalitiesService.createMunicipality({
        name: form.name.trim(),
        districtId: form.districtId,
      });

      setForm(initialForm);
      onCreated?.();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "No se pudo crear el municipio";

      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    setForm(initialForm);
    onCancel?.();
  }

  return (
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
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    name: event.target.value,
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
                    {districts.map((district) => (
                      <SelectItem key={district.id} value={district.id}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </FieldSet>
      </CardContent>

      <CardFooter className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" type="button" onClick={handleCancel}>
          Cancelar
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear municipio"}
        </Button>
      </CardFooter>
    </form>
  );
}