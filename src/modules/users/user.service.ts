import { api } from "@/lib/axios";
import type { CreateUserDto, User } from "./user.types";
import { API_ROUTES } from "@/config/api.routes";

export const userService = {
  async getUsers() {
    const response = await api.get<User[]>(API_ROUTES.users.getUsers);
    return response.data;
  },

  async getUserById(id: string) {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  async inviteUser(data: CreateUserDto) : Promise<any> {
    const response = await api.post(API_ROUTES.users.inviteUser, data);
    return response.data;
  }

};