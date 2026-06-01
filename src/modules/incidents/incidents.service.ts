import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";
import type { AdminIncidentDetail, IncidentDetail, MapIncident, Incident } from "./incidents.type";

interface GetIncidentsFilters {
  status?: string;
  priority?: string;
}

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
  },

  async getIncidents(filters?: GetIncidentsFilters): Promise<Incident[]> {
    const response = await api.get<Incident[]>(API_ROUTES.incidents.getAll, {
      params: filters,
    });
    return response.data;
  },

  async getIncidentById(id: string): Promise<AdminIncidentDetail> {
    const response = await api.get<AdminIncidentDetail>(API_ROUTES.incidents.getById(id));
    return response.data;
  },

  async assignOperator(incidentId: string, operatorId: string): Promise<void> {
    await api.patch(API_ROUTES.incidents.assignOperator(incidentId), {
      operatorId,
    });
  },
};