import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { fetchMe, login as loginRequest } from '../api/auth';
import { clearTokens, getToken } from '../api/client';
import { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          setUser(await fetchMe());
        } catch {
          clearTokens();
        }
      }
      setLoading(false);
    })();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const u = await loginRequest(email, password);
        setUser(u);
      },
      logout: () => {
        clearTokens();
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
