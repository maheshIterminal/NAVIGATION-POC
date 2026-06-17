import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../services/api';
import { sessionStorage } from '../services/sessionStorage';
import type { DriverProfile } from '../types/order';

type AuthContextValue = {
  token: string | null;
  driver: DriverProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const [storedToken, storedDriver] = await Promise.all([
          sessionStorage.getToken(),
          sessionStorage.getDriverJson(),
        ]);
        if (storedToken && storedDriver) {
          setToken(storedToken);
          setDriver(JSON.parse(storedDriver) as DriverProfile);
        }
      } finally {
        setIsLoading(false);
      }
    }
    void restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login(email, password);
    await sessionStorage.saveSession(response.token, JSON.stringify(response.driver));
    setToken(response.token);
    setDriver(response.driver);
  }, []);

  const logout = useCallback(async () => {
    await sessionStorage.clearSession();
    setToken(null);
    setDriver(null);
  }, []);

  const value = useMemo(
    () => ({ token, driver, isLoading, login, logout }),
    [token, driver, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
