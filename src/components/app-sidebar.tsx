import * as React from "react";
import { Link } from "react-router-dom";

import { NavMain } from "@/components/nav-main";
//import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  HardHat,
  LifeBuoyIcon,
  PieChartIcon,
  MapIcon,
  ChartColumnIncreasing,
  OctagonAlert,
  Activity,
} from "lucide-react";

import logo from "@/assets/logo2.png";

import { useAuthUser } from "@/modules/auth/auth.context";
import { APP_ROUTES } from "@/config/app.routes";
import { APP_NAME } from "@/config/const.globs";

const USER_ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  OPERATOR: "operator",
} as const;

type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

function canShowItem(
  allowedRoles: UserRole[],
  userRole: string | undefined
) {
  if (!userRole) return false;

  return allowedRoles.includes(userRole as UserRole);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useAuthUser();

  const navMain = [
    {
      title: "Municipios",
      url: APP_ROUTES.panel.municipalities,
      icon: <PieChartIcon />,
      isActive: true,
      allowedRoles: [USER_ROLES.SUPERADMIN],
    },
    {
      title: "Estadísticas de uso",
      url: APP_ROUTES.panel.systemStats,
      icon: <Activity />,
      allowedRoles: [USER_ROLES.SUPERADMIN],
      items: [
        {
          title: "Uso de VPS",
          url: APP_ROUTES.panel.systemStats,
        },
        {
          title: "Uso global",
          url: APP_ROUTES.panel.systemOverview,
        },
      ],
    },
    {
      title: user?.role === USER_ROLES.SUPERADMIN ? "Administradores" : "Operadores",
      url: APP_ROUTES.panel.users,
      icon: <HardHat />,
      allowedRoles: [USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN],
    },
    {
      title: "Incidentes",
      url: APP_ROUTES.panel.incidents,
      icon: <OctagonAlert />,
      allowedRoles: [USER_ROLES.ADMIN],
      items: [
        {
          title: "Visualizar",
          url: APP_ROUTES.panel.incidents,
        },
        {
          title: "Resueltos",
          url: APP_ROUTES.panel.incidentResolved,
        },
        {
          title: "Historial",
          url: APP_ROUTES.panel.incidentHistory,
        },
        {
          title: "Mapa",
          url: APP_ROUTES.panel.incidentMap,
        },
      ],
    },
    {
      title: "Estadísticas",
      url: APP_ROUTES.panel.incidentStats,
      icon: <ChartColumnIncreasing />,
      allowedRoles: [USER_ROLES.ADMIN],
      items: [
        {
          title: "Principal",
          url: APP_ROUTES.panel.incidentStats
        },
        {
          title: "Urgentes",
          url: APP_ROUTES.panel.incidentUrgentStats,
        },
      ],
    },
    /*{
      title: "Usuarios",
      url: APP_ROUTES.panel.citizens,
      icon: <User />,
      allowedRoles: [USER_ROLES.ADMIN],
      items: [
        {
          title: "Visualizar",
          url: APP_ROUTES.panel.citizens,
        },
        {
          title: "Estadísticas",
          url: APP_ROUTES.panel.citizenStats,
        },
      ],
    },*/
    {
      title: "Incidentes",
      url: APP_ROUTES.operator.root,
      icon: <MapIcon />,
      allowedRoles: [USER_ROLES.OPERATOR],
      items: [
        {
          title: "Visualizar",
          url: APP_ROUTES.operator.root,
        },
        {
          title: "Historial",
          url: APP_ROUTES.operator.history,
        },
      ],
    },
  ];

  const navSecondary = [
    {
      title: "Soporte",
      url: APP_ROUTES.panel.support,
      icon: <LifeBuoyIcon />,
      allowedRoles: [USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN],
    }
  ];

  /*const projects = [
    {
      name: "Estadísticas",
      url: "/panel/statistics",
      icon: <FrameIcon />,
      allowedRoles: [USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN],
    }
  ];*/

  const filteredNavMain = navMain.filter((item) =>
    canShowItem(item.allowedRoles, user?.role)
  );

  const filteredNavSecondary = navSecondary.filter((item) =>
    canShowItem(item.allowedRoles, user?.role)
  );

  /*const filteredProjects = projects.filter((item) =>
    canShowItem(item.allowedRoles, user?.role)
  );*/

  const data = {
    userr: {
      name: isLoading ? "Cargando..." : user?.name ?? "Usuario",
      email: user?.email ?? "",
      avatar: user?.photoUrl ?? "/avatars/shadcn.jpg",
    },
    navMain: filteredNavMain,
    navSecondary: filteredNavSecondary
    //projects: filteredProjects,
  };

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to={user?.role === USER_ROLES.OPERATOR ? "/operator" : "/panel"}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white overflow-hidden">
                  <img
                    src={logo}
                    alt={APP_NAME}
                    className="h-6 w-6 object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{APP_NAME}</span>
                  <span className="truncate text-xs">
                    {user?.role === USER_ROLES.SUPERADMIN
                      ? "Panel global"
                      : "Panel municipal"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.userr} />
      </SidebarFooter>
    </Sidebar>
  );
}
