import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";
import type { Disctrict, DistrictResponse } from "./district.type";
import type { SubDistrictResponse, SubDistrictsApiResponse } from "@/modules/incidents/incidents.type";


export const districtsService = {
  async getDistricts(): Promise<Disctrict[]> {
    const response = await api.get<Disctrict[]>(API_ROUTES.districts.getDistricts);

    return response.data;
  },

  async getMyDistrict(): Promise<DistrictResponse> {
    const response = await api.get<DistrictResponse>(API_ROUTES.districts.getMyDistrict());
    return response.data;
  }
};

export const subDistrictsService = {
  async getByMunicipalityId(municipalityId: string): Promise<SubDistrictResponse[]> {
    const response = await api.get<SubDistrictsApiResponse>(
      API_ROUTES.sub_districts.getByMunicipalityId(municipalityId)
    );
    return response.data.data;
  },
};