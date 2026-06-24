import { api } from "@/lib/axios";
import type { CreateUserDto, GetUser, User, OperatorDetail, UpdateMyProfileData } from "./user.types";
import { API_ROUTES } from "@/config/api.routes";

export const userService = {
  async getUsers() {
    const response = await api.get<User[]>(API_ROUTES.users.getUsers);
    return response.data;
  },

  async updateMyProfile(data: UpdateMyProfileData) {
  const response = await api.patch(API_ROUTES.users.updateMyProfile, data);
  return response.data;
},

  async getUserById(id: string) {
    const response = await api.get<User>(API_ROUTES.users.getUserById(id));
    return response.data;
  },

  async inviteUser(data: CreateUserDto): Promise<any> {
    const response = await api.post(API_ROUTES.users.inviteUser, data);
    return response.data;
  },

  async getAdmins(): Promise<GetUser[]> {
    const response = await api.get(API_ROUTES.users.getUsers, {
      params: {
        role: "admin",
      },
    });

    return response.data;
  },

  async getOperators(): Promise<GetUser[]> {
    const response = await api.get(API_ROUTES.users.getUsers, {
      params: {
        role: "operator",
      },
    });

    return response.data;
  },

  async getCitizens(): Promise<User[]> {
    const response = await api.get(API_ROUTES.users.getUsers, {
      params: {
        role: "citizen",
      },
    });

    return response.data;
  },

  async updateUserStatus(id: string, status: string): Promise<any> {
    const response = await api.patch(API_ROUTES.users.updateUserStatus(id), { status });
    return response.data;
  },

  async getOperatorById(id: string): Promise<OperatorDetail> {
    const response = await api.get<OperatorDetail>(API_ROUTES.users.getUserById(id));
    return response.data;
  },
};