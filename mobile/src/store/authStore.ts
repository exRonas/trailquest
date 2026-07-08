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
  isNetworkError,
} from '../api/client';
import {
  clearTokens,
  loadTokens,
  saveTokens,
} from '../services/keychain';
import { clearCachedUser, loadCachedUser, saveCachedUser } from '../services/userCache';

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
      void saveCachedUser(user);
      set({ status: 'authenticated', user });
    } catch (err) {
      if (isNetworkError(err)) {
        // Couldn't reach the server to validate — that's not the same as an
        // invalid session. Stay logged in with the last-known profile so
        // opening the app with no signal doesn't bounce you to the login
        // screen; the request interceptor's real 401 handling still logs
        // out properly once a genuinely rejected token is used.
        const cachedUser = await loadCachedUser();
        set({ status: 'authenticated', user: cachedUser });
        return;
      }
      await clearTokens();
      await clearCachedUser();
      setAuthTokens(null);
      set({ status: 'unauthenticated', user: null });
    }
  },

  login: async (email, password) => {
    const auth = await loginRequest({ email, password });
    await persist(auth);
    void saveCachedUser(auth.user);
    set({ status: 'authenticated', user: auth.user });
  },

  register: async (email, password, name) => {
    const auth = await registerRequest({ email, password, name });
    await persist(auth);
    void saveCachedUser(auth.user);
    set({ status: 'authenticated', user: auth.user });
  },

  logout: async () => {
    await clearTokens();
    await clearCachedUser();
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
    void saveCachedUser(auth.user);
    useAuthStore.setState({ user: auth.user, status: 'authenticated' });
  },
  onUnauthorized: () => {
    void clearTokens();
    void clearCachedUser();
    setAuthTokens(null);
    useAuthStore.setState({ status: 'unauthenticated', user: null });
  },
});
