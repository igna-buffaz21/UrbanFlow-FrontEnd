import * as React from "react";

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
  TerminalSquareIcon,
  BotIcon,
  BookOpenIcon,
  Settings2Icon,
  LifeBuoyIcon,
  SendIcon,
  FrameIcon,
  PieChartIcon,
  MapIcon,
  TerminalIcon,
} from "lucide-react";

import { useAuthUser } from "@/modules/auth/auth.context";
import { APP_ROUTES } from "@/config/app.routes";

const USER_ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
} as const;

type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

type RoleProtectedItem = {
  allowedRoles: UserRole[];
};

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
      items: [
        {
          title: "Visualizar",
          url: APP_ROUTES.panel.municipalities,
        },
        {
          title: "Crear",
          url: APP_ROUTES.panel.createMunicipality,
        },
      ],
    },
    {
      title: "Usuarios",
      url: APP_ROUTES.panel.users,
      icon: <TerminalSquareIcon />,
      allowedRoles: [USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN],
      items: [
        {
          title: "Visualizar",
          url: APP_ROUTES.panel.users,
        },
        {
          title: "Crear",
          url: APP_ROUTES.panel.createUser,
        },
      ],
    },
    {
      title: "Incidentes",
      url: "/panel/municipalities",
      icon: <MapIcon />,
      allowedRoles: [USER_ROLES.ADMIN], 
      items: [
        {
          title: "Visualizar",
          url: "/panel/municipalities",
        },
        {
          title: "Historial",
          url: "/panel/municipalities/create",
        },
      ],
    },
    {
      title: "Estadisticas",
      url: "/panel/operators",
      icon: <BotIcon />,
      allowedRoles: [USER_ROLES.ADMIN],
      items: [
        {
          title: "Visualizar",
          url: "/panel/operators",
        },
      ],
    }
  ];

  const navSecondary = [
    {
      title: "Soporte",
      url: "/panel/support",
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
              <a href="/panel">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <TerminalIcon className="size-4" />
                </div>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">UrbanFlow</span>
                  <span className="truncate text-xs">
                    {user?.role === USER_ROLES.SUPERADMIN
                      ? "Panel global"
                      : "Panel municipal"}
                  </span>
                </div>
              </a>
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