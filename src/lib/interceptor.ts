// src/lib/setupApiInterceptors.ts

import { api } from "@/lib/axios";

type GetToken = () => Promise<string | null>;

export function setupApiInterceptors(getToken: GetToken) {
  const interceptorId = api.interceptors.request.use(async (config) => {
    const token = await getToken();

    console.log("INTERCEPTOR EJECUTADO:", config.url);
    console.log("TOKEN:", token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  return () => {
    api.interceptors.request.eject(interceptorId);
  };
}