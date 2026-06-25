import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";
import type {
  GetSystemHistoryParams,
  SystemCurrentMetrics,
  SystemHistorySnapshot,
  SystemOverview,
} from "./system.types";

export const systemService = {
  async getCurrent(): Promise<SystemCurrentMetrics> {
    const response = await api.get<SystemCurrentMetrics>(API_ROUTES.system.current);

    return response.data;
  },

  async getHistory(params?: GetSystemHistoryParams): Promise<SystemHistorySnapshot[]> {
    const response = await api.get<SystemHistorySnapshot[]>(API_ROUTES.system.history, {
      params,
    });

    return response.data;
  },

  async getOverview(): Promise<SystemOverview> {
    const response = await api.get<SystemOverview>(API_ROUTES.system.overview);

    return response.data;
  },
};
