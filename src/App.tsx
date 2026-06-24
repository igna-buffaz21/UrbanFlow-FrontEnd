import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { AppVersionProvider } from "../src/hooks/version";

import { ProtectedRoute } from "./lib/protectedRoute";
import { setupApiInterceptors } from "./lib/interceptor";

import LoginPage from "./modules/auth/pages/login";
import SignUpPage from "./modules/auth/pages/signup";
import { AcceptInvitationPage } from "./modules/auth/pages/acceptInvitation";
import { UnauthorizedPage } from "./modules/auth/pages/unauthorized.page";
import { InactiveAccountPage } from "./modules/auth/pages/inactiveAccount.page";

import PanelLayout from "./components/layout/panelLayout";
import AppLayout from "./components/layout/appLayout";
import { AppLoading } from "./components/app-loading";
import { Toaster } from "sonner";

import { APP_ROUTES } from "./config/app.routes";
import { USER_ROLES } from "./config/const.globs";

import AdminDashboardPage from "./modules/home/pages/dashboard.page";
import { ShowUsersPage } from "./modules/users/pages/showUsers.page";
import { CreateUsersPage } from "./modules/users/pages/createUsers.page";
import { OperatorDetailPage } from "./modules/users/pages/operatorDetail";
import { ShowProfile } from "./modules/users/pages/showProfile.page";
import { CompleteProfilePage } from "./modules/users/pages/completeProfile.page";
import { ResolvedIncidentDetailPage } from "./modules/incidents/pages/resolvedIncidentDetail";
import { IncidentStatsPage } from "./modules/incidents/pages/incidentStatsAdmin";

import { ShowMunicipalitiesPage } from "./modules/municipalities/pages/showMunicipalities";
import { CreateMunicipality } from "./modules/municipalities/pages/createMunicipalities";

import { ShowIncidents } from "./modules/incidents/pages/showIncidents";
import { ShowAdminIncidentsPage } from "./modules/incidents/pages/showPanelIncidentsAdmin";
import { AssignIncidentPage } from "./modules/incidents/pages/assignIncident";
import { ShowIncidentsHistoryPage } from "./modules/incidents/pages/showIncidentHistory";
import { ShowResolvedIncidentsPage } from "./modules/incidents/pages/showResolvedIncidents";
import { ShowOperatorIncidents } from "./modules/incidents/pages/showOperatorIncidents";
import { ShowIncidentsCitizen } from "./modules/incidents/pages/showIncidentCitizen";
import { ShowReportsCitizen } from "./modules/incidents/pages/showMyReports";
import IncidentFeed from "./modules/incidents/pages/feedIncident";
import { ShowCommentsCitizen } from "./modules/incidents/pages/showMyComments";
import { AdminIncidentMapPage } from "./modules/incidents/pages/AdminIncidentMap";

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
    <>
      <AppVersionProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path={APP_ROUTES.auth.login} element={<LoginPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route
            path={APP_ROUTES.auth.aceptInvitation}
            element={<AcceptInvitationPage />}
          />
          <Route path={APP_ROUTES.auth.unauthorized} element={<UnauthorizedPage />} />
          <Route path={APP_ROUTES.auth.inactive} element={<InactiveAccountPage />} />
          <Route
            path={APP_ROUTES.app.completeProfile}
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.CITIZEN]}>
                <CompleteProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path={APP_ROUTES.panel.root}
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN]}>
                <PanelLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />

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
              path={APP_ROUTES.panel.incidentResolved}
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <ShowResolvedIncidentsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path={APP_ROUTES.panel.incidentResolvedDetail}
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <ResolvedIncidentDetailPage />
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
              path={APP_ROUTES.panel.incidentMap}
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminIncidentMapPage />
                </ProtectedRoute>
              }
            />

            <Route
              path={APP_ROUTES.panel.incidentStats}
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <IncidentStatsPage />
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
            <Route path={APP_ROUTES.app.myIncidents} element={<ShowIncidentsCitizen />} />
            <Route path={APP_ROUTES.app.myReports} element={<ShowReportsCitizen />} />
            <Route path={APP_ROUTES.app.feed} element={<IncidentFeed />} />
            <Route path={APP_ROUTES.app.myComments} element={<ShowCommentsCitizen />} />
          </Route>
        </Routes>

        <Toaster theme="dark" position="top-right" />
      </AppVersionProvider>
    </>
  );
}

export default App;