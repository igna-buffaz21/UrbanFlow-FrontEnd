import type { UserRole } from "../users/user.types";
import { APP_ROUTES } from "@/config/app.routes";

export function getRedirectPathByRole(role: UserRole): string {
  const routesByRole: Record<UserRole, string> = {
    superadmin: APP_ROUTES.panel.root,
    admin: APP_ROUTES.panel.root,
    operator: APP_ROUTES.operator.root,
    citizen: APP_ROUTES.app.root
  };

  return routesByRole[role];
}