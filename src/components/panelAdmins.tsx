import { useAuthUser } from "@/modules/auth/auth.context";
import { USER_ROLES } from "@/config/const.globs";

import AdminDashboardPage from "@/modules/home/pages/dashboard.page";
import { SuperAdminHomePage } from "@/modules/home/pages/superadminHome.page";

export function PanelHomePage() {
  const { user } = useAuthUser();

  if (user?.role === USER_ROLES.SUPERADMIN) {
    return <SuperAdminHomePage />;
  }

  return <AdminDashboardPage />;
}