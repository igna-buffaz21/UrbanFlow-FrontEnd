import { SignIn, useAuth } from "@clerk/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authService } from "../auth.service";
import type { AuthUserResponse } from "../auth.types";

import { getRedirectPathByRole } from "../auth.utils";

function LoginPage() {
  const navigate = useNavigate();

  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();

  const [userData, setUserData] = useState<AuthUserResponse | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetryLogin() {
    setError(null);
    setUserData(null);

    await signOut();

    navigate("/login", { replace: true });
  }

  useEffect(() => {
    async function loadAuthenticatedUser() {
      if (!isLoaded) return;
      if (!isSignedIn) return;

      try {
        setIsLoadingUserData(true);
        setError(null);

        const user = await authService.getAuth();

        setUserData(user);

        console.log("Usuario autenticado en backend:", user);

        const redirectPath = getRedirectPathByRole(user.role);

        navigate(redirectPath, { replace: true });

      } catch (err) {
        console.error("Error al obtener el usuario autenticado:", err);

        setError(
          "No pudimos obtener los datos del usuario. Verificá que tu cuenta esté habilitada."
        );
      } finally {
        setIsLoadingUserData(false);
      }
    }

    loadAuthenticatedUser();
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Lado izquierdo */}
        <section className="hidden flex-col justify-between bg-muted p-10 lg:flex">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">UrbanFlow</h1>
            <p className="mt-2 max-w-md text-muted-foreground">
              Plataforma de gestión inteligente para municipios, operadores e
              incidencias urbanas.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight">
                Gestioná tu ciudad de forma simple.
              </h2>
              <p className="mt-4 max-w-lg text-lg text-muted-foreground">
                Centralizá usuarios, operadores, distritos e incidencias desde
                un único panel moderno y seguro.
              </p>
            </div>

            <div className="rounded-xl border bg-background/60 p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Sistema seguro de autenticación con Clerk, roles de usuario y
                control de acceso por municipio.
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            © 2026 UrbanFlow. Todos los derechos reservados.
          </p>
        </section>

        {/* Lado derecho */}
        <section className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight">
                Iniciar sesión
              </h2>
              <p className="mt-2 text-muted-foreground">
                Ingresá con tu cuenta para acceder al panel.
              </p>
            </div>

            {isLoadingUserData && (
              <div className="rounded-md border bg-muted p-3 text-sm text-muted-foreground">
                Cargando datos del usuario...
              </div>
            )}

            {error && (
              <div className="space-y-3 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm">
                <p className="text-destructive">{error}</p>

                <button
                  type="button"
                  onClick={handleRetryLogin}
                  className="rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cerrar sesión e intentar de nuevo
                </button>
              </div>
            )}

            {!isSignedIn && !error && (
              <div className="flex justify-center lg:justify-start">
                <SignIn
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "w-full border shadow-lg rounded-2xl",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton:
                        "border rounded-md hover:bg-muted",
                      formButtonPrimary:
                        "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md",
                      formFieldInput: "rounded-md border bg-background",
                      footerActionLink: "text-primary hover:text-primary/80",
                    },
                  }}
                />
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default LoginPage;