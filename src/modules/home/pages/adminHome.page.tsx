import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminHomePage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Bienvenido, Francisco</h1>
        <p className="text-muted-foreground">
          Gestioná los Municipios y Administradores.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Panel de Superadmin</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            Usá el menú lateral para visualizar o crear municipalidades y ver o crear administradores.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}