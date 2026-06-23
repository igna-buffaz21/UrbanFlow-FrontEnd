import { VILLA_MARIA_SUB_DISTRICTS } from "@/modules/districts/data/villaMariaSubDistricts";

const GEOREF_API_URL = "https://apis.datos.gob.ar/georef/api";

let cachedProvinces: string[] | null = null;
const cachedCitiesByProvince: Record<string, string[]> = {};

export const locationService = {
    async getProvinces(): Promise<string[]> {
        if (cachedProvinces) {
            return cachedProvinces;
        }

        const response = await fetch(
            `${GEOREF_API_URL}/provincias?campos=nombre&max=24`
        );

        if (!response.ok) {
            throw new Error("No se pudieron cargar las provincias");
        }

        const data = await response.json();

        const provinces = data.provincias?.map(
            (province: { nombre: string }) => province.nombre
        ) || [];

        cachedProvinces = Array.from(new Set<string>(provinces)).sort((a, b) =>
            a.localeCompare(b)
        );

        return cachedProvinces;
    },

    async getCities(province: string): Promise<string[]> {
        if (cachedCitiesByProvince[province]) {
            return cachedCitiesByProvince[province];
        }

        const response = await fetch(
            `${GEOREF_API_URL}/localidades?provincia=${encodeURIComponent(province)}&campos=nombre&max=5000`
        );

        if (!response.ok) {
            throw new Error("No se pudieron cargar las ciudades");
        }

        const data = await response.json();

        const cities = data.localidades?.map(
            (city: { nombre: string }) => city.nombre
        ) || [];

        cachedCitiesByProvince[province] = Array.from(new Set<string>(cities)).sort(
            (a, b) => a.localeCompare(b)
        );

        return cachedCitiesByProvince[province];
    },

    async getSubDistricts(city: string): Promise<string[]> {
        if (city !== "Villa María") {
            return [];
        }

        return VILLA_MARIA_SUB_DISTRICTS;
    },
};