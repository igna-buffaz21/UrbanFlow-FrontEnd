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
    citizens: "/panel/citizens",
    incidents: "/panel/incidents",
    incidentDetail: "incidents/:id",
    incidentDetailPath: (id: string) => `/panel/incidents/${id}`,
    incidentHistory: "/panel/incidents/history",
    municipalities: "/panel/municipalities",
    createMunicipality: "/panel/municipalities/create",
    operatorDetail: "operators/:id",
    operatorDetailPath: (id: string) => `/panel/operators/${id}`,
    incidentResolved: "/panel/incidents/resolved",
    incidentResolvedDetail: "/panel/incidents/resolved/:id",
    incidentResolvedDetailPath: (id: string) => `/panel/incidents/resolved/${id}`,
    incidentStats: "/panel/incidents/stats",
    incidentUrgentStats: "/panel/incidents/stats/urgent",
    incidentMap: "/panel/incidents/map",
    citizenStats: "/panel/users/stats",
    systemStats: "/panel/system/stats",
    systemOverview: "/panel/system/overview",
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
    feed: "/app/feed",
    report: "/app/report",
    myIncidents: "/app/my-incidents",
    profile: "/app/profile",
    myReports: "/app/my-reports",
    completeProfile: "/complete-profile",
    myComments: "/app/my-comments"
  },
} as const;
