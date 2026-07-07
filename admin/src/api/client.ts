import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4001/api';

const TOKEN_KEY = 'tq_admin_access';
const REFRESH_KEY = 'tq_admin_refresh';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}
export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}
export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((req) => {
  const token = getToken();
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// ─── Transparent refresh ───────────────────────────────────────────────────
// The access token is short-lived (15min) — a route-editing session in the
// admin easily outlasts that, so a bare 401 must trigger a silent refresh +
// retry instead of surfacing a confusing error mid-edit.
const refreshClient = axios.create({ baseURL: API_URL });

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<{ data: { accessToken: string; refreshToken: string } }>(
        '/auth/refresh',
        { refreshToken },
      )
      .then((res) => {
        const auth = res.data.data;
        setTokens(auth.accessToken, auth.refreshToken);
        return auth.accessToken;
      })
      .catch(() => {
        clearTokens();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isRefreshCall = original?.url?.includes('/auth/refresh');

    if (status === 401 && original && !original._retried && !isRefreshCall) {
      original._retried = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      // Refresh failed — the session is genuinely dead, send back to login.
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

export function unwrap<T>(payload: { data: T }): T {
  return payload.data;
}

export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as
      | { error?: { message?: string; details?: { message: string }[] } }
      | undefined;
    if (body?.error?.message) {
      const detail = body.error.details?.[0]?.message;
      return detail ? `${body.error.message}: ${detail}` : body.error.message;
    }
    if (err.message === 'Network Error') return 'Cannot reach the API server.';
  }
  return fallback;
}
