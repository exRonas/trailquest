import { create } from 'zustand';
import { AuthResponse, User } from '../types/api';
import {
  loginRequest,
  registerRequest,
  fetchMe,
} from '../api/auth.api';
import {
  registerAuthHandlers,
  setAuthTokens,
} from '../api/client';
import {
  clearTokens,
  loadTokens,
  saveTokens,
} from '../services/keychain';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  /** Restore a session from secure storage on app launch (auto-login). */
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

async function persist(auth: AuthResponse): Promise<void> {
  await saveTokens({
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
  });
  setAuthTokens({
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
  });
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,

  hydrate: async () => {
    set({ status: 'loading' });
    const tokens = await loadTokens();
    if (!tokens) {
      set({ status: 'unauthenticated', user: null });
      return;
    }
    setAuthTokens(tokens);
    try {
      // Validates the token (and transparently refreshes it if expired).
      const user = await fetchMe();
      set({ status: 'authenticated', user });
    } catch {
      await clearTokens();
      setAuthTokens(null);
      set({ status: 'unauthenticated', user: null });
    }
  },

  login: async (email, password) => {
    const auth = await loginRequest({ email, password });
    await persist(auth);
    set({ status: 'authenticated', user: auth.user });
  },

  register: async (email, password, name) => {
    const auth = await registerRequest({ email, password, name });
    await persist(auth);
    set({ status: 'authenticated', user: auth.user });
  },

  logout: async () => {
    await clearTokens();
    setAuthTokens(null);
    set({ status: 'unauthenticated', user: null });
  },
}));

// Wire the API client's refresh / forced-logout callbacks to the store exactly
// once at module load.
registerAuthHandlers({
  onTokensRefreshed: (auth) => {
    void saveTokens({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
    });
    useAuthStore.setState({ user: auth.user, status: 'authenticated' });
  },
  onUnauthorized: () => {
    void clearTokens();
    setAuthTokens(null);
    useAuthStore.setState({ status: 'unauthenticated', user: null });
  },
});
