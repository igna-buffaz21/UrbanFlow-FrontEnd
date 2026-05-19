// src/modules/auth/pages/UnauthorizedPage.tsx

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Acceso no autorizado</h1>
        <p className="text-muted-foreground">
          No tenés permisos para acceder a esta sección.
        </p>
      </div>
    </div>
  );
}