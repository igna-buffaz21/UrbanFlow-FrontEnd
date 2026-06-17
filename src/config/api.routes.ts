export const API_ROUTES = {
  auth: {
    me: "/auth/me",
  },
  users: {
    getUsers: "/users",
    getUserById: (id: string) => `/users/${id}`,
    inviteUser: "/users/invite",
    updateUserStatus: (id: string) => `/users/${id}/status`,
  },

  municipalities: {
    getMunicipalities: "/municipalities",
    createMunicipality: "/municipalities",
  },


  districts: {
    getDistricts: "/districts",
  },

  incidents: {
    getIncidentsMap: (lng: string, lat: string, radius: string) => `/incidents/map?lng=${lng}&lat=${lat}&radius=${radius}`,
    getDetailIncidentById: (id: string) => `/incidents/${id}`,
    createIncidents: "/incidents",
    getAll: "/incidents",
    getAssigned: "/incidents/assigned",
    getById: (id: string) => `/incidents/${id}`,
    updateStatus: (id: string) => `/incidents/${id}/status`,
    assignOperator: (id: string) => `/incidents/${id}/assign-operator`,
    getIncidentsCitizen: () => `/incidents/me`,
    resolveDuplicateIncident: (idIncidentDuplicate: string) => `/incidents/pending/${idIncidentDuplicate}/resolve-duplicate`,
    feed: (lat: number, lng: number, page?: number, limit?: number) => `/incidents/feed?lat=${lat}&lng=${lng}&page=${page}&limit=${limit}`
  },

  incident_reports: {
    getReportByIncidentId: (id: string) => `/incident-report/${id}/report`,
    createReport: (id: string) => `/incident-report/${id}/report`,
    deleteReport: (id: string) => `/incident-report/${id}/report`,
    getMyReports: () => `/incident-report/reports/me`,
  },

  incident_comments: {
    getCommentsByIncidentId: (id: string) => `/incident-comments/${id}/comments`,
    createComment: (id: string) => `/incident-comments/${id}/comments`,
  }
} as const;