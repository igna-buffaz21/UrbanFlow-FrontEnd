import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { userService } from "@/modules/users/user.service";

type Props = {
    open: boolean;
    municipalityId: string;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
};

export function DialogCreateOperator({ open, municipalityId, onOpenChange, onSuccess }: Props) {
    const [email, setEmail] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    function handleClose(value: boolean) {
        onOpenChange(value);
        setEmail("");
        setErrorMessage("");
        setSuccessMessage("");
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        try {
            setIsCreating(true);
            setErrorMessage("");
            setSuccessMessage("");

            await userService.inviteUser({
                email,
                role: "operator",
                municipalityId,
            });

            setSuccessMessage("Operador invitado correctamente. Recibirá un email para activar su cuenta.");
            setEmail("");
            onSuccess();

            setTimeout(() => handleClose(false), 2000);
        } catch (error: any) {
            setErrorMessage(error?.response?.data?.message ?? "Error al crear el operador.");
        } finally {
            setIsCreating(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crear operador</DialogTitle>
                    <DialogDescription>
                        Ingresá el email del nuevo operador. Recibirá una invitación para activar su cuenta.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <FieldSet>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="create-email">Email del operador</FieldLabel>
                                <Input
                                    id="create-email"
                                    type="email"
                                    placeholder="operador@email.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </Field>
                        </FieldGroup>
                    </FieldSet>

                    {errorMessage && <p className="text-sm text-destructive mt-2">{errorMessage}</p>}
                    {successMessage && <p className="text-sm text-green-500 mt-2">{successMessage}</p>}

                    <DialogFooter className="mt-4">
                        <Button variant="outline" type="button" onClick={() => handleClose(false)} disabled={isCreating}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isCreating}>
                            {isCreating ? "Creando..." : "Crear operador"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}