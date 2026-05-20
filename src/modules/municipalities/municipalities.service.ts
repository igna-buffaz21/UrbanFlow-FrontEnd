import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";
import type { CreateMunicipality, Municipality } from "./municipalities.type";

export const municipalitiesService = {
  async getMunicipalities(): Promise<Municipality[]> {
    const response = await api.get<Municipality[]>(API_ROUTES.municipalities.getMunicipalities);
    
    return response.data;
  },

  async createMunicipality(data: CreateMunicipality): Promise<Municipality[]> {
    const response = await api.post<Municipality[]>(API_ROUTES.municipalities.createMunicipality, data);
    
    return response.data;
  }
};