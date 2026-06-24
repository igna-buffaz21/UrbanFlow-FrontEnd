// src/config/toast-messages.ts

export const TOAST_MESSAGES = {
  incidents: {
    cancelSuccess: "Incidente cancelado correctamente.",
    cancelError: "No pudimos cancelar el incidente. Intentá nuevamente.",
    createSuccess: "Incidente reportado correctamente.",
    createError: "No pudimos crear el incidente. Revisá los datos e intentá nuevamente.",
    updateStatusSuccess: "Estado actualizado correctamente.",
    updateStatusError: "No pudimos actualizar el estado. Intentá nuevamente.",

    cancelIncidentSuccess: "El incidente fue dado de baja correctamente.",
    cancelIncidentError: "No pudimos dar de baja el incidente. Intentá nuevamente.",
  },

  auth: {
    profileCompleted: "Tus datos fueron guardados correctamente.",
    profileError: "No pudimos guardar tus datos. Revisá la información e intentá nuevamente.",
  },

  location: {
    permissionError: "No pudimos obtener tu ubicación. Revisá los permisos del navegador.",
  },
} as const;