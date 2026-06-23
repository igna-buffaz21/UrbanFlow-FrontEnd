import { useEffect, useState } from "react";

import { incidentsService } from "../incidents.service";
import type { OperatorIncident } from "../incidents.type";

import { IncidentDetailDialog } from "@/components/dialog-incident";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRIORITY_LABELS, PRIORITY_STYLES } from "../incidents.constants";


export function ShowOperatorIncidentsHistory() {
  const [incidents, setIncidents] = useState<OperatorIncident[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  async function loadIncidents() {
    try {
      setIsLoading(true);

      const data = await incidentsService.getAssignedIncidents({
        status: "resolved",
      });

      setIncidents(data);
    } catch (error) {
      console.error("Error al obtener historial de incidentes:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadIncidents();
  }, []);

  function handleOpenDetail(incidentId: string) {
    setSelectedIncidentId(incidentId);
    setIsDetailDialogOpen(true);
  }

  return (
    <div className="flex justify-center p-6">
      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle>Historial de incidentes</CardTitle>
          <CardDescription>
            Incidentes resueltos que fueron asignados a vos.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Asignado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : incidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center">
                      No tenés incidentes resueltos.
                    </TableCell>
                  </TableRow>
                ) : (
                  incidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-medium">
                        {incident.title}
                      </TableCell>

                      <TableCell>
                        <Badge className={PRIORITY_STYLES[incident.priority]}>
                          {PRIORITY_LABELS[incident.priority]}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {incident.assignedAt
                          ? new Date(incident.assignedAt).toLocaleDateString("es-AR")
                          : "-"}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetail(incident.id)}
                        >
                          Ver detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground">
            {incidents.length} incidentes resueltos
          </p>
        </CardContent>
      </Card>

      <IncidentDetailDialog
        incidentId={selectedIncidentId}
        open={isDetailDialogOpen}
        onOpenChange={(open) => {
          setIsDetailDialogOpen(open);

          if (!open) {
            loadIncidents();
          }
        }}
      />
    </div>
  );
}