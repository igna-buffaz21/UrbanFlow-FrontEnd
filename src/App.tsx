import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "@clerk/react";

import { ProtectedRoute } from "./lib/protectedRoute";

import LoginPage from "./modules/auth/pages/login";
import { setupApiInterceptors } from "./lib/interceptor";
import ShowUsers from "./modules/users/pages/showUsers.page";
import { APP_ROUTES } from "./config/app.routes";
import HomePage from "./modules/home/pages/Panelhome.page";
import PanelLayout from "./components/layout/panelLayout";
import { UnauthorizedPage } from "./modules/auth/pages/unauthorized.page";
import { InactiveAccountPage } from "./modules/auth/pages/inactiveAccount.page";

import { USER_ROLES } from "./config/const.globs";
import AppLayout from "./components/layout/appLayout";
import AppHomePage from "./modules/home/pages/appHome.page";
import { ShowMunicipalitiesPage } from "./modules/municipalities/pages/showMunicipalities";
import { CreateMunicipality } from "./modules/municipalities/pages/createMunicipalities";

function App() {
  const { getToken, isLoaded } = useAuth();
  const [isApiReady, setIsApiReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    const cleanup = setupApiInterceptors(getToken);

    setIsApiReady(true);

    return cleanup;
  }, [isLoaded, getToken]);

  if (!isLoaded || !isApiReady) {
    return <div>Cargando...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route path={APP_ROUTES.auth.login} element={<LoginPage />} />

      <Route
        path={APP_ROUTES.auth.unauthorized}
        element={<UnauthorizedPage />}
      />

      <Route
        path={APP_ROUTES.auth.inactive}
        element={<InactiveAccountPage />}
      />

      <Route
        path={APP_ROUTES.panel.root}
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN]}>
            <PanelLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />

        <Route path={APP_ROUTES.panel.users} element={<ShowUsers />} />

          <Route
            path={APP_ROUTES.panel.municipalities}
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.SUPERADMIN]}>
                <ShowMunicipalitiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={APP_ROUTES.panel.createMunicipality}
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.SUPERADMIN]}>
                <CreateMunicipality />
              </ProtectedRoute>
            }
          />
      </Route>

      <Route
        path={APP_ROUTES.app.root}
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.CITIZEN]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AppHomePage />} />
        
      </Route>
    </Routes>
  );
}

export default App;