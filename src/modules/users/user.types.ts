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