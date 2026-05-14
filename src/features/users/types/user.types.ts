export type UserRole = "superadmin" | "admin" | "operator";

export type UserStatus = "active" | "inactive";

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

export interface CreateUserDto {
  email: string;
  role: UserRole;
  municipalityId?: string;
}

export interface UpdateUserStatusDto {
  status: UserStatus;
}