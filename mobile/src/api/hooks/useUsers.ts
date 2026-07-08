import { useMutation, useQuery } from '@tanstack/react-query';
import {
  changeMyPassword,
  fetchPublicProfile,
  updateMyAvatar,
  updateMyName,
} from '../users.api';
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

export function useUpdateName() {
  return useMutation({
    mutationFn: (name: string) => updateMyName(name),
    onSuccess: (user) => {
      useAuthStore.setState({ user });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      changeMyPassword(input.currentPassword, input.newPassword),
  });
}
