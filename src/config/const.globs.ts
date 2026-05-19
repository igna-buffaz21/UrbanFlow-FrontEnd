// src/modules/auth/constants/auth.constants.ts

import type { AuthUserResponse } from "@/modules/auth/auth.types";

export const USER_ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  OPERATOR: "operator",
  CITIZEN: "citizen",
} as const satisfies Record<string, AuthUserResponse["role"]>;
