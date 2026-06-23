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

    useEffect(() => {
        async function loadProvinces() {
            try {
                setIsLoadingProvinces(true);
                const provincesData = await locationService.getProvinces();
                setProvinces(provincesData);
            }
            catch (error) {
                console.error("Error al cargar provincias:", error);
            }
            finally {
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
            }
            catch (error) {
                console.error("Error al cargar ciudades:", error);
                setCities([]);
            }
            finally {
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
            }
            catch (error) {
                console.error("Error al cargar barrios:", error);
                setSubDistricts([]);
            }
            finally {
                setIsLoadingSubDistricts(false);
            }
        }

        loadSubDistricts();
    }, [formData.city, shouldShowSubDistrict]);

    function handleChange(field: keyof UpdateMyProfileData, value: string) {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
            ...(field === "province" ? { city: "", subDistrict: "" } : {}),
            ...(field === "city" ? { subDistrict: "" } : {}),
        }));

    }

    async function handleCompleteProfile(e: React.FormEvent) {
        e.preventDefault();

        try {
            setIsLoading(true);

            if (!formData.dni.trim()) {
                alert("El DNI es obligatorio");
                return;
            }

            if (!formData.phone.trim()) {
                alert("El teléfono es obligatorio");
                return;
            }

            if (!formData.province.trim()) {
                alert("La provincia es obligatoria");
                return;
            }

            if (!formData.city.trim()) {
                alert("La ciudad es obligatoria");
                return;
            }

            if (shouldShowSubDistrict && !formData.subDistrict.trim()) {
                alert("El barrio es obligatorio");
                return;
            }

            if (!formData.address.trim()) {
                alert("La dirección es obligatoria");
                return;
            }

            if (!formData.postalCode.trim()) {
                alert("El código postal es obligatorio");
                return;
            }

            await userService.updateMyProfile({
                ...formData,
                dni: formData.dni.trim(),
                phone: formData.phone.trim(),
                address: formData.address.trim(),
                province: formData.province.trim(),
                city: formData.city.trim(),
                subDistrict: shouldShowSubDistrict ? formData.subDistrict.trim() : "",
                postalCode: formData.postalCode.trim(),
            });

            await clerkUser?.reload();
            await refreshUser();

            navigate(APP_ROUTES.app.root, { replace: true });
        }
        catch (error: any) {
            console.error("Error completando perfil:", error);
            alert(error?.response?.data?.message || "No se pudo completar el perfil");
        }
        finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-dvh items-center justify-center bg-zinc-950 px-4 py-8 text-white">
            <form
                onSubmit={handleCompleteProfile}
                className="w-full max-w-md space-y-4 rounded-3xl bg-zinc-900 p-6 shadow-2xl"
            >
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-white">
                        Completá tu perfil
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Necesitamos tus datos para que puedas reportar incidentes.
                    </p>
                </div>

                <Input
                    placeholder="DNI"
                    value={formData.dni}
                    onChange={(e) => handleChange("dni", e.target.value)}
                />

                <Input
                    placeholder="Teléfono"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                />

                <SearchSelect
                    value={formData.province}
                    placeholder="Seleccioná una provincia..."
                    searchPlaceholder="Buscar provincia..."
                    options={provinces}
                    disabled={isLoadingProvinces}
                    onChange={(value) => handleChange("province", value)}
                />

                <SearchSelect
                    value={formData.city}
                    placeholder="Seleccioná una ciudad..."
                    searchPlaceholder="Buscar ciudad..."
                    options={cities}
                    disabled={!formData.province || isLoadingCities}
                    onChange={(value) => handleChange("city", value)}
                />

                {shouldShowSubDistrict && (
                    <SearchSelect
                        value={formData.subDistrict}
                        placeholder="Seleccioná un barrio..."
                        searchPlaceholder="Buscar barrio..."
                        options={subDistricts}
                        disabled={isLoadingSubDistricts}
                        onChange={(value) => handleChange("subDistrict", value)}
                    />
                )}

                <Input
                    placeholder="Dirección"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                />

                <Input
                    placeholder="Código postal"
                    value={formData.postalCode}
                    onChange={(e) => handleChange("postalCode", e.target.value)}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Continuar"}
                </Button>
            </form>
        </div>
    );
}