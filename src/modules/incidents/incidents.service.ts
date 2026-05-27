import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";
import type { IncidentDetail, MapIncident } from "./incidents.type";

export const incidentsService = {
  async getIncidentsMap(lat: string, lng: string, radius: string): Promise<MapIncident[]> {
    const response = await api.get<MapIncident[]>(API_ROUTES.incidents.getIncidentsMap(lng, lat, radius));
    
    return response.data;
  },

  async getDetailIncidentById(id: string): Promise<IncidentDetail> {
    const response = await api.get<IncidentDetail>(API_ROUTES.incidents.getDetailIncidentById(id));
    
    return response.data;
  },
  async createIncident(data: FormData) {
  const response = await api.post(API_ROUTES.incidents.createIncidents, data);

  return response.data;
}
};