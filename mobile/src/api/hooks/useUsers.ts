import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchPublicProfile, updateMyAvatar } from '../users.api';
import { queryKeys } from '../queryClient';
import { useAuthStore } from '../../store/authStore';

export function usePublicProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.publicProfile(userId),
    queryFn: () => fetchPublicProfile(userId),
  });
}

export function useUpdateAvatar() {
  return useMutation({
    mutationFn: (avatar: string | null) => updateMyAvatar(avatar),
    onSuccess: (user) => {
      useAuthStore.setState({ user });
    },
  });
}
