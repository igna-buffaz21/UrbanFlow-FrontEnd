export const API_ROUTES = {
  auth: {
    me: "/auth/me",
  },
  users: {
    list: "/users",
    detail: (id: string) => `/users/${id}`,
    create: "/users",
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },

  municipalities: {
    getMunicipalities: "/municipalities",
    createMunicipality: "/municipalities",
  },

  districts: {
    getDistricts: "/districts",
  },

  incidents: {
    list: "/incidents",
    detail: (id: string) => `/incidents/${id}`,
    create: "/incidents",
    update: (id: string) => `/incidents/${id}`,
  },
} as const;