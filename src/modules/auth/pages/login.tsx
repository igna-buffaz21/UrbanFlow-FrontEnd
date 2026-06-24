import { SignIn, useAuth } from "@clerk/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authService } from "../auth.service";
import { getRedirectPathByRole } from "../auth.utils";
import { AppVersionLabel } from "@/components/app-version-label";

function LoginPage() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, signOut } = useAuth();

  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedUser = useRef(false);

  async function handleRetryLogin() {
    setError(null);
    hasLoadedUser.current = false;

    await signOut();

    navigate("/login", { replace: true });
  }

  useEffect(() => {
    async function loadAuthenticatedUser() {
      if (!isLoaded || !isSignedIn || hasLoadedUser.current) return;

      hasLoadedUser.current = true;

      try {
        setIsLoadingUserData(true);
        setError(null);

        const user = await authService.getAuth();
        const redirectPath = getRedirectPathByRole(user.role);

        navigate(redirectPath, { replace: true });
      } catch (err) {
        console.error("Error al obtener el usuario autenticado:", err);

        setError(
          "No pudimos obtener los datos del usuario. Verificá que tu cuenta esté habilitada."
        );

        hasLoadedUser.current = false;
      } finally {
        setIsLoadingUserData(false);
      }
    }

    loadAuthenticatedUser();
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="fixed inset-0 flex flex-col bg-background text-foreground">
      <main className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm space-y-6 px-4">
          {isLoadingUserData && (
            <p className="text-center text-sm text-muted-foreground">
              Cargando datos del usuario...
            </p>
          )}

          {error && (
            <div className="space-y-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>

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
            <SignIn
              signUpUrl="/sign-up"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "w-full border bg-card shadow-none",
                },
              }}
            />
          )}
        </div>
      </main>

      <footer className="space-y-1.5 px-4 pb-4 text-center">
        <AppVersionLabel />

        <p className="text-[11px] leading-tight text-muted-foreground/70">
          © {new Date().getFullYear()} ReportaYa. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}

export default LoginPage;
