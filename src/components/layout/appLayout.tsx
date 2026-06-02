import { Outlet, NavLink } from "react-router-dom";
import { Home, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/config/app.routes";

const navItems = [
  { to: APP_ROUTES.app.root, icon: Home, label: "Inicio" },
  { to: APP_ROUTES.app.feed, icon: Search, label: "Feed" },
  { to: APP_ROUTES.app.profile, icon: User, label: "Perfil" },
];

export default function AppLayout() {
  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Contenido principal con scroll */}
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      {/* Bottom navbar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-around h-16 px-4 max-w-lg mx-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === APP_ROUTES.app.root}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all duration-200",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      "transition-all duration-200",
                      isActive ? "size-6 stroke-[2.5]" : "size-6 stroke-[1.5]"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-medium tracking-wide transition-all duration-200",
                      isActive ? "opacity-100" : "opacity-60"
                    )}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}