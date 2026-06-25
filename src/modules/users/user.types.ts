export type UserRole = "superadmin" | "admin" | "operator" | "citizen";

export type UserStatus = "active" | "inactive" | "blocked";

export interface User {
  _id?: string;
  clerkId?: string;
  clerkInvitationId?: string;
  name?: string;
  email: string;
  photoUrl?: string;
  role: UserRole;
  status: UserStatus;
  municipalityId?: string;
  createdAt: Date;
  updatedAt: Date;
  phone?: string | null;
}

export interface GetUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  name: string;
  photoUrl: string;
  municipality: UserMunicipality | null;
}

export interface UpdateMyProfileData {
  dni: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  subDistrict: string;
  postalCode: string;
}

export interface UserMunicipality {
  id: string;
  name: string;
}

export interface CreateUserDto {
  email: string;
  role: UserRole;
  municipalityId?: string;
}

export interface UpdateUserStatusDto {
  status: UserStatus;
}

export interface OperatorDetail {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  municipality: UserMunicipality | null;
  photoUrl: string | null;
  createdAt: Date;
}

export interface InviteUserResponse {
  id: string;
  clerkInvitationId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  municipalityId: string;
}

export interface UpdateUserStatusResponse {
  message: string;
  user: {
    id: string;
    status: UserStatus;
  };
}

export interface CitizenDetail {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  municipality: UserMunicipality | null;
  photoUrl: string | null;
  createdAt: Date;
  dni?: string | null;
  phone?: string | null;
  address?: string | null;
  province?: string | null;
  city?: string | null;
  subDistrict?: string | null;
  postalCode?: string | null;
}

export interface GetCitizen {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  name: string;
  photoUrl: string;
  municipality: UserMunicipality | null;
  dni?: string;
  phone?: string;
  createdAt?: string;
}

export interface PaginatedCitizensResponse {
  data: GetCitizen[];
  total: number;
}