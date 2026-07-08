import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { RouteSummary } from '../types/api';
import { queryKeys } from '../api/queryClient';

/**
 * Last-known unfiltered routes list, persisted so a cold start with no signal
 * still shows the Explore list instead of "Маршрутов: 0". React Query's own
 * cache is in-memory only and doesn't survive the process being killed, so
 * without this the very first offline launch has nothing to render.
 *
 * Only the unfiltered list is cached (that's what Explore falls back to);
 * filtered/searched results still need the network.
 */

const CACHE_KEY = 'tq_cached_routes_v1';

export async function saveRoutesCache(routes: RouteSummary[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(routes));
  } catch {
    // Best-effort cache; a write failure just means the next cold start has
    // nothing to show, same as before this existed.
  }
}

export async function loadRoutesCache(): Promise<RouteSummary[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as RouteSummary[]) : null;
  } catch {
    return null;
  }
}

/**
 * Seed React Query's unfiltered-routes cache from disk on app launch, but only
 * if it's still empty — a live fetch that already landed must always win over
 * a stale snapshot.
 */
export async function hydrateRoutesCache(queryClient: QueryClient): Promise<void> {
  const key = queryKeys.routes({});
  if (queryClient.getQueryData(key)) return;
  const cached = await loadRoutesCache();
  if (cached && cached.length > 0) {
    queryClient.setQueryData(key, cached);
  }
}
