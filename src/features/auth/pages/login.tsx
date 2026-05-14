import {
  Show,
  SignIn,
  UserButton,
  useUser,
  useAuth,
} from "@clerk/react";
import { useEffect } from "react";

function LoginPage() {
  const { user, isLoaded } = useUser();
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    async function showUserData() {
      if (!isLoaded) return;

      console.log("USER COMPLETO:", user);

      if (!user || !isSignedIn) {
        console.log("No hay usuario logueado");
        return;
      }

      const token = await getToken();

      console.log("TOKEN:", token);

      console.log("ID:", user.id);
      console.log("Email:", user.primaryEmailAddress?.emailAddress);
      console.log("Nombre:", user.firstName);
      console.log("Apellido:", user.lastName);
      console.log("Imagen:", user.imageUrl);
    }

    showUserData();
  }, [user, isLoaded, isSignedIn, getToken]);

  return (
    <div className="min-h-screen bg-background">
      <Show when="signed-out">
        <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
          {/* Lado izquierdo */}
          <section className="hidden flex-col justify-between bg-muted p-10 lg:flex">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                UrbanFlow
              </h1>
              <p className="mt-2 max-w-md text-muted-foreground">
                Plataforma de gestión inteligente para municipios, operadores
                e incidencias urbanas.
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
                      formFieldInput:
                        "rounded-md border bg-background",
                      footerActionLink:
                        "text-primary hover:text-primary/80",
                    },
                  }}
                />
              </div>
            </div>
          </section>
        </main>
      </Show>

      <Show when="signed-in">
        <main className="min-h-screen bg-muted/40">
          <header className="flex h-16 items-center justify-between border-b bg-background px-6">
            <div>
              <h1 className="text-xl font-semibold">UrbanFlow</h1>
              <p className="text-sm text-muted-foreground">
                Panel de administración
              </p>
            </div>

            <UserButton />
          </header>

          <section className="p-6">
            <div className="rounded-xl border bg-background p-6 shadow-sm">
              <h2 className="text-2xl font-bold">Bienvenido</h2>
              <p className="mt-2 text-muted-foreground">
                Ya estás autenticado correctamente.
              </p>
            </div>
          </section>
        </main>
      </Show>
    </div>
  );
}

export default LoginPage;