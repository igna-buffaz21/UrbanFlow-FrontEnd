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
    incidentAssign: "incidents/:id/assign",
    municipalities: "/panel/municipalities",
    createMunicipality: "/panel/municipalities/create",
  },

  operator: {
    root: "/operator",
    incidents: "/operator/incidents",
    tasks: "/operator/tasks",
  },

  app: {
    root: "/app",
    feed: "app/feed",
    report: "/app/report",
    myReports: "/app/my-reports",
    profile: "/app/profile",
  },
} as const;