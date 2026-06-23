import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/react";

import { APP_ROUTES } from "@/config/app.routes";
import { useAuthUser } from "@/modules/auth/auth.context";
import type { AuthUserResponse } from "@/modules/auth/auth.types";

import { AppLoading } from "@/components/app-loading";

type UserRole = AuthUserResponse["role"];

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: UserRole[];
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();

  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoading } = useAuthUser();

  if (!isLoaded || isLoading) {
    return (
      <AppLoading
        title="Cargando información"
        description="Estamos validando tus permisos..."
      />
    );
  }

  if (!isSignedIn) {
    return (
      <Navigate
        to={APP_ROUTES.auth.login}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (!user) {
    return <Navigate to={APP_ROUTES.auth.login} replace />;
  }

  if (user.status !== "active") {
    return <Navigate to={APP_ROUTES.auth.inactive} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={APP_ROUTES.auth.unauthorized} replace />;
  }

  const isCompleteProfileRoute =
    location.pathname === APP_ROUTES.app.completeProfile;

  if (
    user.role === "citizen" &&
    !user.isProfileCompleted &&
    !isCompleteProfileRoute
  ) {
    return <Navigate to={APP_ROUTES.app.completeProfile} replace />;
  }

  if (
    user.role === "citizen" &&
    user.isProfileCompleted &&
    isCompleteProfileRoute
  ) {
    return <Navigate to={APP_ROUTES.app.root} replace />;
  }

  return <>{children}</>;
}