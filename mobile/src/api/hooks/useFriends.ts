import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptFriend,
  addFriend,
  fetchFriends,
  fetchFriendStatus,
  removeFriend,
} from '../friends.api';
import { queryKeys } from '../queryClient';

export function useFriends() {
  return useQuery({
    queryKey: queryKeys.friends(),
    queryFn: fetchFriends,
  });
}

export function useFriendStatus(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.friendStatus(userId ?? 'none'),
    queryFn: () => fetchFriendStatus(userId as string),
    enabled: !!userId,
  });
}

/** Invalidate the friend list + the per-user status after any change. */
function invalidateFriends(
  qc: ReturnType<typeof useQueryClient>,
  userId: string,
) {
  qc.invalidateQueries({ queryKey: queryKeys.friends() });
  qc.invalidateQueries({ queryKey: queryKeys.friendStatus(userId) });
}

export function useAddFriend(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => addFriend(userId),
    onSuccess: () => invalidateFriends(qc, userId),
  });
}

export function useAcceptFriend(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => acceptFriend(userId),
    onSuccess: () => invalidateFriends(qc, userId),
  });
}

export function useRemoveFriend(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => removeFriend(userId),
    onSuccess: () => invalidateFriends(qc, userId),
  });
}
