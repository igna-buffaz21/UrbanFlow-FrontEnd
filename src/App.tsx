import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "@clerk/react";

import { ProtectedRoute } from "./lib/protectedRoute";

import LoginPage from "./modules/auth/pages/login";
import { setupApiInterceptors } from "./lib/interceptor";
import { ShowUsersPage } from "./modules/users/pages/showUsers.page";
import { APP_ROUTES } from "./config/app.routes";
import HomePage from "./modules/home/pages/Panelhome.page";
import PanelLayout from "./components/layout/panelLayout";
import { UnauthorizedPage } from "./modules/auth/pages/unauthorized.page";
import { InactiveAccountPage } from "./modules/auth/pages/inactiveAccount.page";

import { USER_ROLES } from "./config/const.globs";
import AppLayout from "./components/layout/appLayout";
import { ShowMunicipalitiesPage } from "./modules/municipalities/pages/showMunicipalities";
import { CreateMunicipality } from "./modules/municipalities/pages/createMunicipalities";
import { ShowIncidents } from "./modules/incidents/pages/showIncidents";
import { CreateUsersPage } from "./modules/users/pages/createUsers.page";
import { AcceptInvitationPage } from "./modules/auth/pages/acceptInvitation";
import { AppLoading } from "./components/app-loading";
import { ShowAdminIncidentsPage } from "./modules/incidents/pages/showPanelIncidents";
import { AssignIncidentPage } from "./modules/incidents/pages/assignIncident";
import { ShowIncidentsHistoryPage } from "./modules/incidents/pages/showIncidentHistory";
import { ShowOperatorIncidents } from "./modules/incidents/pages/showOperatorIncidents";
import { OperatorIncidentDetailPage } from "./modules/incidents/pages/operatorIncidentDetail";
import { ShowOperatorIncidentsHistory } from "./modules/incidents/pages/showOperatorIncidentHistory";
import { OperatorDetailPage } from "./modules/users/pages/operatorDetail";
import { ShowProfile } from "./modules/users/pages/showProfile.page";
import SignUpPage from "./modules/auth/pages/signup";
import { ShowIncidentsCitizen } from "./modules/incidents/pages/showIncidentCitizen";


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
    return (
      <AppLoading
        title="Cargando aplicación"
        description="Estamos validando tu sesión..."
      />
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route path={APP_ROUTES.auth.login} element={<LoginPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />

      <Route path={APP_ROUTES.auth.aceptInvitation} element={<AcceptInvitationPage />} />

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

        <Route path={APP_ROUTES.panel.users} element={<ShowUsersPage />} />

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

        <Route
          path={APP_ROUTES.panel.createUser}
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN]}>
              <CreateUsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={APP_ROUTES.panel.incidents}
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN]}>
              <ShowAdminIncidentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={APP_ROUTES.panel.incidentDetail}
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <AssignIncidentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={APP_ROUTES.panel.incidentHistory}
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN]}>
              <ShowIncidentsHistoryPage />
            </ProtectedRoute>
          }

        />

        <Route
          path={APP_ROUTES.panel.operatorDetail}
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <OperatorDetailPage />
            </ProtectedRoute>
          }
        />

      </Route>


      <Route
        path={APP_ROUTES.operator.root}
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.OPERATOR]}>
            <ShowOperatorIncidents />
          </ProtectedRoute>
        }
      />

      <Route
        path={APP_ROUTES.app.root}
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.CITIZEN]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ShowIncidents />} />

        <Route path={APP_ROUTES.app.profile} element={<ShowProfile />} />

        <Route path={APP_ROUTES.app.myReports} element={<ShowIncidentsCitizen />} />

      </Route>
    </Routes>
  );
}

export default App;