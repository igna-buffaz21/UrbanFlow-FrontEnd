import { api } from "@/lib/axios";
import type { AuthUserResponse } from "./auth.types";
import { API_ROUTES } from "@/config/api.routes";

export const authService = {
  async getAuth(): Promise<AuthUserResponse> {
    const response = await api.get<AuthUserResponse>(API_ROUTES.auth.me);
    
    return response.data;
  }
};