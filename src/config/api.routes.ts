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
    list: "/municipalities",
    detail: (id: string) => `/municipalities/${id}`,
    create: "/municipalities",
    update: (id: string) => `/municipalities/${id}`,
  },

  incidents: {
    list: "/incidents",
    detail: (id: string) => `/incidents/${id}`,
    create: "/incidents",
    update: (id: string) => `/incidents/${id}`,
  },
} as const;