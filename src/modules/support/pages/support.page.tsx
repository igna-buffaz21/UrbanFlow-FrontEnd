import { APP_NAME } from "@/config/const.globs";

const SUPPORT_EMAIL = "reportayalbm@gmail.com";
const SUPPORT_PHONE = "+54 353 413 3580";
const SUPPORT_PHONE_LINK = "+543534133580";

export function SupportPage() {
  return (
    <section className="flex h-full flex-1 items-center justify-center overflow-hidden">
      <div className="space-y-5 text-center">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Soporte 24/7
        </p>

        <h1 className="text-7xl font-medium leading-tight tracking-tight">
          {APP_NAME}
        </h1>

        <div className="mx-auto h-px w-10 bg-border" />

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Asistencia disponible las 24 horas, los 7 dias de la semana.</p>
          <a
            href={`tel:${SUPPORT_PHONE_LINK}`}
            className="block text-primary hover:underline"
          >
            {SUPPORT_PHONE}
          </a>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-block text-primary hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>
    </section>
  );
}
