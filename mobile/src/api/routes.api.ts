import { api, unwrap } from './client';
import { Language } from '../i18n/translations';
import { saveRoutesCache } from '../services/routesCache';
import {
  CountryOption,
  RouteDetail,
  RouteFilters,
  RouteSummary,
} from '../types/api';

export async function fetchRoutes(
  filters: RouteFilters = {},
): Promise<RouteSummary[]> {
  const params: Record<string, string> = {};
  if (filters.category) params.category = filters.category;
  if (filters.difficulty) params.difficulty = filters.difficulty;
  if (filters.region) params.region = filters.region;
  if (filters.country) params.country = filters.country;

  const res = await api.get<{ data: RouteSummary[] }>('/routes', { params });
  const routes = unwrap(res.data);
  // Persist the unfiltered list for offline cold starts (see routesCache.ts).
  if (Object.keys(params).length === 0) {
    void saveRoutesCache(routes);
  }
  return routes;
}

export async function fetchCountries(lang: Language): Promise<CountryOption[]> {
  const res = await api.get<{ data: CountryOption[] }>('/routes/countries', {
    params: { lang },
  });
  return unwrap(res.data);
}

export async function fetchRouteById(id: string): Promise<RouteDetail> {
  const res = await api.get<{ data: RouteDetail }>(`/routes/${id}`);
  return unwrap(res.data);
}
