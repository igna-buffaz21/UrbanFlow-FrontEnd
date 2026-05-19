import { api } from "@/lib/axios";
import type { CreateUserDto, UpdateUserStatusDto, User } from "./types/user.types";

export const userService = {
  async getUsers() {
    const response = await api.get<User[]>("/users");
    return response.data;
  },

  async getUserById(id: string) {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  async createUser(data: CreateUserDto) {
    const response = await api.post<User>("/users", data);
    return response.data;
  },

  async updateUserStatus(id: string, data: UpdateUserStatusDto) {
    const response = await api.patch<User>(`/users/${id}/status`, data);
    return response.data;
  },

  async deleteUser(id: string) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};