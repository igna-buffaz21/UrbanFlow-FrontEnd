export const APP_ROUTES = {
  auth: {
    login: "/login",
    aceptInvitation: "/accept-invitation",
    unauthorized: "/unauthorized",
    inactive: "/inactive",
  },

  panel: {
    root: "/panel",
    users: "/panel/users",
    createUser: "/panel/users/create",
    incidents: "/panel/incidents",
    incidentDetail: "incidents/:id",
    incidentDetailPath: (id: string) => `/panel/incidents/${id}`,
    incidentHistory: "/panel/incidents/history",
    municipalities: "/panel/municipalities",
    createMunicipality: "/panel/municipalities/create",
    operatorDetail: "operators/:id",
    operatorDetailPath: (id: string) => `/panel/operators/${id}`,
  },

  operator: {
    root: "/operator",
    incidents: "/operator/incidents",
    incidentDetail: "incidents/:id",
    incidentDetailPath: (id: string) => `/operator/incidents/${id}`,
    history: "/operator/incidents/history",
  },

  app: {
    root: "/app",
    feed: "app/feed",
    report: "/app/report",
    myReports: "/app/my-reports",
    profile: "/app/profile",
  },
} as const;