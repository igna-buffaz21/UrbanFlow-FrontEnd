
export interface AuthUserResponse {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  photoUrl: string;
  role: "superadmin" | "admin" | "operator" | "citizen";
  status: "active" | "inactive";
  municipalityId?: string;
}