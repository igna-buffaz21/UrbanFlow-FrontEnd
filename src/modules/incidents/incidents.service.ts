import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";
import type {
  AdminIncidentDetail,
  MapIncident,
  Incident,
  OperatorIncident,
  IncidentMe,
  IncidentCommentResponse,
  IncidentReportResponse,
  ReportedIncidentResponse,
  IncidentDetailResponse,
  ResolvePendingDuplicateResponse,
  ResolvePendingDuplicateAction,
  IncidentFeedItem,
  IncidentFeedResponse,
  PaginatedIncidentsResponse
} from "./incidents.type";

interface GetIncidentsFilters {
  status?: string;
  priority?: string;
}

interface GetIncidentFeedParams {
  lat: number;
  lng: number;
  page?: number;
  limit?: number;
}

export const incidentsService = {
  async getIncidentsMap(lat: string, lng: string, radius: string): Promise<MapIncident[]> {
    const response = await api.get<MapIncident[]>(API_ROUTES.incidents.getIncidentsMap(lng, lat, radius));
    return response.data;
  },

  async getDetailIncidentById(id: string): Promise<IncidentDetailResponse> {
    const response = await api.get<IncidentDetailResponse>(API_ROUTES.incidents.getDetailIncidentById(id));
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

  async getAssignedIncidents(filters?: GetIncidentsFilters): Promise<OperatorIncident[]> {
    const response = await api.get<OperatorIncident[]>(API_ROUTES.incidents.getAssigned, {
      params: filters,
    });

    return response.data;
  },

  async updateIncidentStatus(id: string, data: FormData) {
    const response = await api.patch(
      API_ROUTES.incidents.updateStatus(id),
      data
    );

    return response.data;
  },

  async updateStatus(incidentId: string, status: string): Promise<void> {
    await api.patch(API_ROUTES.incidents.updateStatus(incidentId), { status });
  },

  async getIncidentsCitizen(): Promise<IncidentMe[]> {
    const response = await api.get<IncidentMe[]>(API_ROUTES.incidents.getIncidentsCitizen(), {});
    return response.data;
  },

  async getIncidentReport(id: string): Promise<IncidentReportResponse> {
    const response = await api.get<IncidentReportResponse>(API_ROUTES.incident_reports.getReportByIncidentId(id), {});
    return response.data;
  },

  async getIncidentComments(id: string): Promise<IncidentCommentResponse[]> {
    const response = await api.get<IncidentCommentResponse[]>(API_ROUTES.incident_comments.getCommentsByIncidentId(id), {});
    return response.data;
  },

  async addIncidentReport(id: string): Promise<void> {
    const response = await api.post(API_ROUTES.incident_reports.createReport(id));
    return response.data;
  },

  async deleteIncidentReport(id: string): Promise<void> {
    const response = await api.delete(API_ROUTES.incident_reports.createReport(id));
    return response.data;
  },

  async addCommentReport(id: string, comment: string): Promise<IncidentCommentResponse> {
    const response = await api.post(API_ROUTES.incident_comments.createComment(id), { comment });
    return response.data;
  },

  async getMyReports(): Promise<ReportedIncidentResponse[]> {
    const response = await api.get<ReportedIncidentResponse[]>(API_ROUTES.incident_reports.getMyReports());
    return response.data;
  },

  async resolvePendingDuplicate(
    pendingIncidentId: string,
    action: ResolvePendingDuplicateAction
  ): Promise<ResolvePendingDuplicateResponse> {
    const response = await api.post<ResolvePendingDuplicateResponse>(
      API_ROUTES.incidents.resolveDuplicateIncident(pendingIncidentId),
      { action }
    );

    return response.data;
  },

  async getFeed(params: GetIncidentFeedParams): Promise<IncidentFeedItem[]> {
    const response = await api.get<IncidentFeedResponse>(
      API_ROUTES.incidents.feed(
        params.lat,
        params.lng,
        params.page,
        params.limit
      )
    );

    return response.data.data;

  },

  async getClosedIncidentsHistory(page: number, limit: number): Promise<PaginatedIncidentsResponse> {
    const response = await api.get<PaginatedIncidentsResponse>(
      API_ROUTES.incidents.history,
      { params: { page, limit } }
    );
    return response.data;
  },



};

