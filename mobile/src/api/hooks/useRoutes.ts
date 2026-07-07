import { useQuery } from '@tanstack/react-query';
import { fetchCountries, fetchRouteById, fetchRoutes } from '../routes.api';
import { queryKeys } from '../queryClient';
import { useLocaleStore } from '../../i18n';
import { RouteFilters } from '../../types/api';

export function useRoutes(filters: RouteFilters = {}) {
  return useQuery({
    queryKey: queryKeys.routes(filters),
    queryFn: () => fetchRoutes(filters),
  });
}

export function useCountries() {
  const language = useLocaleStore((s) => s.language);
  return useQuery({
    queryKey: queryKeys.countries(language),
    queryFn: () => fetchCountries(language),
    staleTime: 5 * 60_000,
  });
}

export function useRouteDetail(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.route(id ?? 'none'),
    queryFn: () => fetchRouteById(id as string),
    enabled: !!id,
  });
}
