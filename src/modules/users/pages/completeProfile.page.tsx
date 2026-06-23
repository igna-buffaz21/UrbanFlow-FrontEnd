import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/search-select";

import { APP_ROUTES } from "@/config/app.routes";
import { useAuthUser } from "@/modules/auth/auth.context";
import { userService } from "@/modules/users/user.service";
import { locationService } from "@/modules/users/services/location.service";
import type { UpdateMyProfileData } from "@/modules/users/user.types";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-sm font-medium text-zinc-200">
      {children}
    </span>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1 block text-xs text-zinc-500">{children}</span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 mb-4">
      <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
        {children}
      </span>
    </div>
  );
}

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const { user: clerkUser } = useUser();
  const { refreshUser } = useAuthUser();

  const [formData, setFormData] = useState<UpdateMyProfileData>({
    dni: "",
    phone: "",
    address: "",
    province: "",
    city: "",
    subDistrict: "",
    postalCode: "",
  });

  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [subDistricts, setSubDistricts] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingSubDistricts, setIsLoadingSubDistricts] = useState(false);

  const shouldShowSubDistrict = formData.city === "Villa María";

  const isFormValid = Boolean(
    formData.dni.trim() &&
      formData.phone.trim() &&
      formData.province.trim() &&
      formData.city.trim() &&
      (!shouldShowSubDistrict || formData.subDistrict.trim()) &&
      formData.address.trim() &&
      formData.postalCode.trim()
  );

  useEffect(() => {
    async function loadProvinces() {
      try {
        setIsLoadingProvinces(true);
        const provincesData = await locationService.getProvinces();
        setProvinces(provincesData);
      } catch (error) {
        console.error("Error al cargar provincias:", error);
      } finally {
        setIsLoadingProvinces(false);
      }
    }
    loadProvinces();
  }, []);

  useEffect(() => {
    async function loadCities() {
      if (!formData.province) {
        setCities([]);
        return;
      }
      try {
        setIsLoadingCities(true);
        const citiesData = await locationService.getCities(formData.province);
        setCities(citiesData);
      } catch (error) {
        console.error("Error al cargar ciudades:", error);
        setCities([]);
      } finally {
        setIsLoadingCities(false);
      }
    }
    loadCities();
  }, [formData.province]);

  useEffect(() => {
    async function loadSubDistricts() {
      if (!formData.city || !shouldShowSubDistrict) {
        setSubDistricts([]);
        return;
      }
      try {
        setIsLoadingSubDistricts(true);
        const subDistrictsData = await locationService.getSubDistricts(formData.city);
        setSubDistricts(subDistrictsData);
      } catch (error) {
        console.error("Error al cargar barrios:", error);
        setSubDistricts([]);
      } finally {
        setIsLoadingSubDistricts(false);
      }
    }
    loadSubDistricts();
  }, [formData.city, shouldShowSubDistrict]);

  function getOnlyNumbers(value: string) {
    return value.replace(/\D/g, "");
  }

  function formatWithDots(value: string) {
    return getOnlyNumbers(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function handleChange(field: keyof UpdateMyProfileData, value: string) {
    const formattedValue =
      field === "dni" ? formatWithDots(value) : field === "phone" ? getOnlyNumbers(value) : value;

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
      ...(field === "province" ? { city: "", subDistrict: "" } : {}),
      ...(field === "city" ? { subDistrict: "" } : {}),
    }));
  }

  async function handleCompleteProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setIsLoading(true);
      await userService.updateMyProfile({
        ...formData,
        dni: getOnlyNumbers(formData.dni),
        phone: getOnlyNumbers(formData.phone),
        address: formData.address.trim(),
        province: formData.province.trim(),
        city: formData.city.trim(),
        subDistrict: shouldShowSubDistrict ? formData.subDistrict.trim() : "",
        postalCode: formData.postalCode.trim(),
      });

      await clerkUser?.reload();
      await refreshUser();
      navigate(APP_ROUTES.app.root, { replace: true });
    } catch (error: any) {
      console.error("Error completando perfil:", error);
      alert(error?.response?.data?.message || "No se pudo completar el perfil");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-950 px-4 py-10 text-white">
      <form
        onSubmit={handleCompleteProfile}
        className="w-full max-w-md space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            Paso 2 de 2
          </p>
          <h1 className="text-2xl font-bold text-white">Completá tu perfil</h1>
          <p className="text-sm text-zinc-400">
            Necesitamos estos datos para que puedas reportar incidentes en tu zona.
          </p>
        </div>

        {/* Datos personales */}
        <div className="space-y-4">
          <SectionTitle>Datos personales</SectionTitle>

          <div>
            <FieldLabel>DNI</FieldLabel>
            <Input
              inputMode="numeric"
              placeholder="Ej. 46.123.456"
              value={formData.dni}
              onChange={(e) => handleChange("dni", e.target.value)}
            />
          </div>

          <div>
            <FieldLabel>Teléfono</FieldLabel>
            <Input
              inputMode="tel"
              placeholder="Ej. 353412345"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>
        </div>

        {/* Ubicación */}
        <div className="space-y-4">
          <SectionTitle>Ubicación</SectionTitle>

          <div>
            <FieldLabel>Provincia</FieldLabel>
            <SearchSelect
              value={formData.province}
              placeholder="Seleccioná una provincia..."
              searchPlaceholder="Buscar provincia..."
              options={provinces}
              disabled={isLoadingProvinces}
              onChange={(value) => handleChange("province", value)}
            />
          </div>

          <div>
            <FieldLabel>Ciudad</FieldLabel>
            <SearchSelect
              value={formData.city}
              placeholder="Seleccioná una ciudad..."
              searchPlaceholder="Buscar ciudad..."
              options={cities}
              disabled={!formData.province || isLoadingCities}
              onChange={(value) => handleChange("city", value)}
            />
            {!formData.province && (
              <FieldHint>Primero seleccioná una provincia</FieldHint>
            )}
          </div>

          {shouldShowSubDistrict && (
            <div>
              <FieldLabel>Barrio</FieldLabel>
              <SearchSelect
                value={formData.subDistrict}
                placeholder="Seleccioná un barrio..."
                searchPlaceholder="Buscar barrio..."
                options={subDistricts}
                disabled={isLoadingSubDistricts}
                onChange={(value) => handleChange("subDistrict", value)}
              />
            </div>
          )}

          <div>
            <FieldLabel>Dirección</FieldLabel>
            <Input
              placeholder="Ej. San Martín 1245"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </div>

          <div>
            <FieldLabel>Código postal</FieldLabel>
            <Input
              inputMode="numeric"
              placeholder="Ej. 5900"
              value={formData.postalCode}
              onChange={(e) => handleChange("postalCode", e.target.value)}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-2 pt-1">
          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? "Guardando..." : "Continuar"}
          </Button>

          {!isFormValid && (
            <p className="text-center text-xs text-zinc-500">
              Completá todos los campos para continuar.
            </p>
          )}

          <p className="text-center text-xs text-zinc-600 pt-1">
            Podés actualizar estos datos después desde tu perfil.
          </p>
        </div>
      </form>
    </div>
  );
}