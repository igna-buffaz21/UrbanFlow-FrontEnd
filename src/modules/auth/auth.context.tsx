// src/modules/auth/auth.context.tsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@clerk/react";

import type { AuthUserResponse } from "./auth.types";
import { authService } from "./auth.service";

type AuthContextValue = {
  user: AuthUserResponse | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logoutLocalUser: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  const [user, setUser] = useState<AuthUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider montado");
  }, []);

  async function refreshUser() {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const authUser = await authService.getAuth();

      setUser(authUser);
    } catch (error) {
      console.error("Error obteniendo usuario autenticado:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  function logoutLocalUser() {
    setUser(null);
  }

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    if (user) {
      setIsLoading(false);
      return;
    }

    refreshUser();
  }, [isLoaded, isSignedIn]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        refreshUser,
        logoutLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthUser() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthUser debe usarse dentro de AuthProvider");
  }

  return context;
}