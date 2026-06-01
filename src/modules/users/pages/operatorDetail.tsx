import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { userService } from "../user.service";
import type { GetUser, OperatorDetail } from "../user.types";

import { APP_ROUTES } from "@/config/app.routes";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function OperatorDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [operator, setOperator] = useState<OperatorDetail | null>(null);
    const [status, setStatus] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        async function loadOperator() {
            if (!id) return;

            try {
                setIsLoading(true);
                const response = await userService.getOperatorById(id);
                setOperator(response);
                setStatus(response.status);
            } catch (error) {
                console.error("Error al cargar operador:", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadOperator();
    }, [id]);

    async function handleUpdateStatus() {
        if (!id) return;

        try {
            setIsUpdating(true);
            await userService.updateUserStatus(id, status);
            setOperator((prev) => prev ? { ...prev, status: status as GetUser["status"] } : prev);
            setIsEditing(false);
        } catch (error) {
            console.error("Error al actualizar estado:", error);
        } finally {
            setIsUpdating(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center p-6">
                <p className="text-muted-foreground">Cargando...</p>
            </div>
        );
    }

    if (!operator) {
        return (
            <div className="flex justify-center p-6">
                <p className="text-muted-foreground">No se encontró el operador.</p>
            </div>
        );
    }

    return (
        <div className="flex justify-center p-6">
            <div className="w-full max-w-md space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Detalle del operador</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Nombre:</span>
                                <span className="text-sm font-medium">{operator.name}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Email:</span>
                                <span className="text-sm">{operator.email}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Municipio:</span>
                                <span className="text-sm">{operator.municipality?.name ?? "Sin municipio"}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Estado:</span>
                                {isEditing ? (
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Activo</SelectItem>
                                            <SelectItem value="inactive">Inactivo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge variant={operator?.status === "active" ? "default" : "secondary"}>
                                        {operator?.status === "active" ? "Activo" : operator?.status === "inactive" ? "Inactivo" : "Bloqueado"}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            {isEditing ? (
                                <>
                                    <Button onClick={handleUpdateStatus} disabled={isUpdating}>
                                        {isUpdating ? "Guardando..." : "Guardar"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setStatus(operator?.status ?? "");
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button onClick={() => setIsEditing(true)}>
                                        Editar estado
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate(APP_ROUTES.panel.users)}
                                    >
                                        Volver
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}