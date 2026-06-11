import { useUser, useAuth, UserProfile } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/config/app.routes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  MessageSquare,
  Heart,
  Bookmark,
  Bell,
  UserRound,
  Shield,
  ChevronRight,
  LogOut,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type UserRole = "user" | "moderator" | "superadmin";

type MenuItem = {
  key: string;
  icon: React.ElementType;
  label: string;
  description: string;
  roles: UserRole[];
  onClick: () => void;
};

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// Simulado — reemplazá con tu hook/contexto de roles real.
function useUserRole(): UserRole {
  return "user";
}

export function ShowProfile() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const role = useUserRole();

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    navigate(APP_ROUTES.auth.login, { replace: true });
  }

  const menuItems: MenuItem[] = [
    {
      key: "edit-profile",
      icon: UserRound,
      label: "Editar perfil",
      description: "Nombre, foto y datos personales",
      roles: ["user", "moderator", "superadmin"],
      onClick: () => setIsEditProfileOpen(true),
    },
    {
      key: "incidents",
      icon: AlertTriangle,
      label: "Mis incidentes",
      description: "Incidentes que reportaste",
      roles: ["user", "moderator"],
      onClick: () => {
        navigate(APP_ROUTES.app.myIncidents);
      },
    },
    {
      key: "comments",
      icon: MessageSquare,
      label: "Mis comentarios",
      description: "Comentarios que dejaste",
      roles: ["user", "moderator"],
      onClick: () => {
        // TODO: navegar o abrir sheet de comentarios
      },
    },
    {
      key: "likes",
      icon: Heart,
      label: "Mis me gusta",
      description: "Incidentes que marcaste",
      roles: ["user", "moderator"],
      onClick: () => {
        navigate(APP_ROUTES.app.myReports);
      },
    },
    {
      key: "moderation",
      icon: Shield,
      label: "Panel de moderación",
      description: "Revisá incidentes reportados",
      roles: ["moderator", "superadmin"],
      onClick: () => {
        // TODO: navegar al panel de moderación
      },
    },
  ];

  const visibleItems = menuItems.filter((item) => item.roles.includes(role));

  return (
    <>
      <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden bg-background">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <span className="text-sm font-semibold tracking-tight">Perfil</span>
        </header>

        {/* Hero del perfil */}
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6">
          <Avatar className="size-20 ring-2 ring-border ring-offset-2 ring-offset-background">
            <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? "Avatar"} />
            <AvatarFallback className="text-xl font-semibold">
              {getInitials(user?.fullName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col items-center gap-0.5 text-center">
            <h1 className="text-base font-semibold tracking-tight leading-tight">
              {user?.fullName ?? "Usuario"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>

        <Separator />

        {/* Items de menú filtrados por rol */}
        <div className="flex flex-col py-1">
          {visibleItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.key}>
                <button
                  type="button"
                  onClick={item.onClick}
                  className={cn(
                    "flex items-center gap-4 w-full px-5 py-3.5 transition-colors duration-150",
                    "hover:bg-muted active:bg-muted/70"
                  )}
                >
                  <Icon className="size-5 text-foreground shrink-0" strokeWidth={1.5} />
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-medium leading-tight">
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground leading-tight mt-0.5">
                      {item.description}
                    </span>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </button>
                {index < visibleItems.length - 1 && (
                  <Separator className="ml-[60px]" />
                )}
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Cerrar sesión */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-4 w-full px-5 py-3.5 transition-colors duration-150 hover:bg-muted active:bg-muted/70"
        >
          <LogOut className="size-5 text-destructive shrink-0" strokeWidth={1.5} />
          <span className="text-sm font-medium text-destructive flex-1 text-left">
            Cerrar sesión
          </span>
        </button>

        {/* Spacer para el navbar */}
        <div className="h-4" />
      </div>

      {/* Dialog de edición de perfil con Clerk */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <UserProfile routing="hash" />
        </DialogContent>
      </Dialog>
    </>
  );
}