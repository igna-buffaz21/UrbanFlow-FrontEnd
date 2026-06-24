import { useState, useRef } from "react";
import { useUser } from "@clerk/react";
import { Camera, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function EditProfileDialog({ open, onOpenChange }: Props) {
  const { user } = useUser();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName]   = useState(user?.lastName ?? "");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile]       = useState<File | null>(null);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty =
    firstName !== (user?.firstName ?? "") ||
    lastName  !== (user?.lastName ?? "")  ||
    avatarFile !== null;

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!user || !isDirty) return;
    setSaveState("saving");

    try {
      const nameChanged =
        firstName !== (user.firstName ?? "") ||
        lastName  !== (user.lastName ?? "");

      if (nameChanged) {
        await user.update({ firstName, lastName });
      }

      if (avatarFile) {
        await user.setProfileImage({ file: avatarFile });
      }

      setSaveState("saved");
      setTimeout(() => {
        setSaveState("idle");
        onOpenChange(false);
      }, 1200);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2500);
    }
  }

  const currentAvatar = avatarPreview ?? user?.imageUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-full p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4">
          <DialogTitle className="text-sm font-semibold tracking-tight">
            Editar perfil
          </DialogTitle>
        </DialogHeader>

        <Separator />

        <div className="flex flex-col gap-6 px-5 py-6">
          {/* Avatar */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group focus:outline-none"
              aria-label="Cambiar foto de perfil"
            >
              <Avatar className="size-20 ring-2 ring-border ring-offset-2 ring-offset-background">
                <AvatarImage src={currentAvatar} alt={user?.fullName ?? "Avatar"} />
                <AvatarFallback className="text-xl font-semibold">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>

              <span className={cn(
                "absolute inset-0 rounded-full flex items-center justify-center",
                "bg-black/40 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                "transition-opacity duration-150"
              )}>
                <Camera className="size-5 text-white" strokeWidth={1.5} />
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Campos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName" className="text-xs text-muted-foreground">
                Nombre
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ignacio"
                className="h-9 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName" className="text-xs text-muted-foreground">
                Apellido
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Buffaz"
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Footer */}
        <div className="px-5 py-4 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={saveState === "saving"}
            className="text-muted-foreground"
          >
            Cancelar
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || saveState === "saving" || saveState === "saved"}
            className="min-w-[110px]"
          >
            {saveState === "saving" && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            {saveState === "saved"  && <Check   className="size-3.5 mr-1.5" />}
            {saveState === "saving" ? "Guardando..."      :
             saveState === "saved"  ? "¡Guardado!"        :
             saveState === "error"  ? "Intentar de nuevo" :
             "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}