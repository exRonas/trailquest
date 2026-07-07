import { useQuery } from '@tanstack/react-query';
import { fetchPublicProfile } from '../users.api';
import { queryKeys } from '../queryClient';

export function usePublicProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.publicProfile(userId),
    queryFn: () => fetchPublicProfile(userId),
  });
}
