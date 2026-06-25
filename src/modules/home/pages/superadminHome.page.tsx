export function SuperAdminHomePage() {
  return (
    <section className="flex items-center justify-center h-full flex-1 overflow-hidden">
      <div className="text-center space-y-5">
        <p className="text-xs text-muted-foreground uppercase tracking-[0.14em]">
          Panel de administración
        </p>
        <h1 className="text-7xl font-medium tracking-tight leading-tight">
          Bienvenido
        </h1>
        <div className="w-10 h-px bg-border mx-auto" />
        <p className="text-sm text-muted-foreground">
          Seleccioná una opción del menú lateral para comenzar.
        </p>
      </div>
    </section>
  );
}