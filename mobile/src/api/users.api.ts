import { api, unwrap } from './client';
import { PublicProfile, User } from '../types/api';

export async function fetchPublicProfile(userId: string): Promise<PublicProfile> {
  const res = await api.get<{ data: PublicProfile }>(`/users/${userId}/profile`);
  return unwrap(res.data);
}

/** Update the signed-in user's avatar (null clears back to initials). */
export async function updateMyAvatar(avatar: string | null): Promise<User> {
  const res = await api.patch<{ data: User }>('/users/me', { avatar });
  return unwrap(res.data);
}
