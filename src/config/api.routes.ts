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
    list: "/incidents",
    detail: (id: string) => `/incidents/${id}`,
    create: "/incidents",
    update: (id: string) => `/incidents/${id}`,
  },
} as const;