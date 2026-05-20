export const APP_ROUTES = {
  auth: {
    login: "/login",
    unauthorized: "/unauthorized",
    inactive: "/inactive",
  },

  panel: {
    root: "/panel",
    users: "/panel/users",
    incidents: "/panel/incidents",
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
    report: "/app/report",
    myReports: "/app/my-reports",
    profile: "/app/profile",
  },
} as const;