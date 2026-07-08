import { api, unwrap } from './client';
import { FriendsResponse, FriendStatus } from '../types/api';

export async function fetchFriends(): Promise<FriendsResponse> {
  const res = await api.get<{ data: FriendsResponse }>('/friends');
  return unwrap(res.data);
}

export async function fetchFriendStatus(userId: string): Promise<FriendStatus> {
  const res = await api.get<{ data: { status: FriendStatus } }>(
    `/friends/${userId}/status`,
  );
  return unwrap(res.data).status;
}

export async function addFriend(userId: string): Promise<FriendStatus> {
  const res = await api.post<{ data: { status: FriendStatus } }>(
    `/friends/${userId}`,
  );
  return unwrap(res.data).status;
}

export async function acceptFriend(userId: string): Promise<void> {
  await api.post(`/friends/${userId}/accept`);
}

export async function removeFriend(userId: string): Promise<void> {
  await api.delete(`/friends/${userId}`);
}
