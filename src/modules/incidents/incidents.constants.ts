export const PRIORITY_LABELS: Record<string, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
    critical: "Crítica",
};

export const PRIORITY_STYLES: Record<string, string> = {
    low: "bg-green-600/10 text-green-600 border border-green-600/30 hover:bg-green-600/10",
    medium: "bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/10",
    high: "bg-red-600/10 text-red-600 border border-red-600/30 hover:bg-red-600/10",
    critical: "bg-purple-600/10 text-purple-600 border border-purple-600/30 hover:bg-purple-600/10",
};

export const STATUS_LABELS: Record<string, string> = {    in_review: "En revisión",
    open: "Abierto",
    assigned: "Asignado",
    in_progress: "En progreso",
    resolved: "Resuelto",
    closed: "Cerrado",
    rejected: "Rechazado",
};