import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";
import type {
  CreateMunicipality,
  Municipality,
  MunicipalityMonthlyUsage,
} from "./municipalities.type";

export const municipalitiesService = {
  async getMunicipalities(): Promise<Municipality[]> {
    const response = await api.get<Municipality[]>(API_ROUTES.municipalities.getMunicipalities);
    
    return response.data;
  },

  async createMunicipality(data: CreateMunicipality): Promise<Municipality[]> {
    const response = await api.post<Municipality[]>(API_ROUTES.municipalities.createMunicipality, data);
    
    return response.data;
  },

  async toggleMunicipalityStatus(id: string): Promise<Municipality> {
    const response = await api.patch<Municipality>(
      API_ROUTES.municipalities.updateMunicipalityStatus(id)
    );

    return response.data;
  },

  async getMunicipalityUsage(id: string, month?: string): Promise<MunicipalityMonthlyUsage> {
    const response = await api.get<MunicipalityMonthlyUsage>(
      API_ROUTES.system.municipalityUsage(id),
      { params: month ? { month } : undefined }
    );

    return response.data;
  },
};
