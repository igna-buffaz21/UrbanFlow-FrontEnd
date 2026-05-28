export const API_ROUTES = {
  auth: {
    me: "/auth/me",
  },
  users: {
    getUsers: "/users",
    getUserById: (id: string) => `/users/${id}`,
    inviteUser: "/users/invite",

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
  },
} as const;