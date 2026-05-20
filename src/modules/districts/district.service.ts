import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";
import type { Disctrict } from "./district.type";

export const districtsService = {
  async getDistricts(): Promise<Disctrict[]> {
    const response = await api.get<Disctrict[]>(API_ROUTES.districts.getDistricts);
    
    return response.data;
  }
};