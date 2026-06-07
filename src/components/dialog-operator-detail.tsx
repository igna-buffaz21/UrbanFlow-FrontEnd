import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { User, XIcon } from "lucide-react";
import type { OperatorDetail } from "@/modules/users/user.types";

type Props = {
    operator: OperatorDetail | null;
    isLoading: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function DialogOperatorDetail({ operator, isLoading, open, onOpenChange }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md" showCloseButton={false}>
                <DialogHeader className="flex-row items-center justify-between">
                    <DialogTitle>Detalle del operador</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
                            <XIcon className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        Cargando detalle...
                    </div>
                ) : operator && (
                    <div className="grid gap-3 rounded-xl border bg-background p-4 sm:grid-cols-2">
                        {[
                            { label: "Nombre", value: operator.name },
                            { label: "Email", value: operator.email },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex items-center gap-3 sm:col-span-2">
                                <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                                    <User className="size-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                    <p className="text-sm font-medium">{value}</p>
                                </div>
                            </div>
                        ))}
                        <div>
                            <p className="text-xs text-muted-foreground">Municipio</p>
                            <p className="text-sm font-medium">{operator.municipality?.name ?? "Sin municipio"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Estado</p>
                            <Badge variant={operator.status === "active" ? "default" : "secondary"}>
                                {operator.status === "active" ? "Activo" : "Inactivo"}
                            </Badge>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}