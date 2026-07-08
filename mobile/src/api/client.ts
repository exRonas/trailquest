import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import { config } from '../config/env';
import { AuthResponse, ApiErrorBody } from '../types/api';
import { StoredTokens } from '../services/keychain';

/**
 * Single axios instance for the whole app. Auth state lives in module-level
 * variables (set by the auth store) so the interceptors can attach the access
 * token and transparently refresh it without importing the store (avoids a
 * circular dependency).
 */

let accessToken: string | null = null;
let refreshToken: string | null = null;

type TokensRefreshedHandler = (auth: AuthResponse) => void;
type UnauthorizedHandler = () => void;

let onTokensRefreshed: TokensRefreshedHandler | null = null;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setAuthTokens(tokens: StoredTokens | null): void {
  accessToken = tokens?.accessToken ?? null;
  refreshToken = tokens?.refreshToken ?? null;
}

export function registerAuthHandlers(handlers: {
  onTokensRefreshed: TokensRefreshedHandler;
  onUnauthorized: UnauthorizedHandler;
}): void {
  onTokensRefreshed = handlers.onTokensRefreshed;
  onUnauthorized = handlers.onUnauthorized;
}

export const api: AxiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((req: InternalAxiosRequestConfig) => {
  if (accessToken) {
    req.headers.Authorization = `Bearer ${accessToken}`;
  }
  return req;
});

// ─── Transparent refresh ───────────────────────────────────────────────────
// A bare client (no interceptors) used to call the refresh endpoint.
const refreshClient = axios.create({ baseURL: config.apiUrl, timeout: 15000 });

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshToken) return null;
  // Single-flight: concurrent 401s share one refresh request.
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<{ data: AuthResponse }>('/auth/refresh', { refreshToken })
      .then((res) => {
        const auth = res.data.data;
        accessToken = auth.accessToken;
        refreshToken = auth.refreshToken;
        onTokensRefreshed?.(auth);
        return auth.accessToken;
      })
      .catch((err) => {
        // Only a real rejection (invalid/expired refresh token) means the
        // session is actually dead. A network failure just means we
        // couldn't reach the server right now — logging out here would
        // wipe a perfectly good session the moment signal drops.
        if (!isNetworkError(err)) {
          onUnauthorized?.();
        }
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
  async (error: AxiosError<ApiErrorBody>) => {
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
    }
    return Promise.reject(error);
  },
);

/**
 * True for a request that never reached the server (no signal, DNS failure,
 * timeout) as opposed to one the server rejected (4xx/5xx). Callers use this
 * to decide whether to fall back to the offline queue (see offlineQueue.ts)
 * instead of surfacing an error.
 */
export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}

/**
 * Normalises any thrown error into a human-readable message, preferring the
 * backend's error envelope.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.error?.message) {
      const details = body.error.details?.[0]?.message;
      return details ? `${body.error.message}: ${details}` : body.error.message;
    }
    if (error.code === 'ECONNABORTED') return 'Request timed out.';
    if (error.message === 'Network Error') {
      return 'No connection to the server. Check your network and the API URL.';
    }
  }
  return fallback;
}

/** Unwraps the `{ data }` success envelope. */
export function unwrap<T>(payload: { data: T }): T {
  return payload.data;
}
