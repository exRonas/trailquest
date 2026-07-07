import { useQuery } from '@tanstack/react-query';
import { fetchAppVersion } from '../appVersion.api';

export function useAppVersion() {
  return useQuery({
    queryKey: ['app-version'] as const,
    queryFn: fetchAppVersion,
    staleTime: 30 * 60_000,
    retry: 0,
  });
}
