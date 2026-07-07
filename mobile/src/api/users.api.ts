import { api, unwrap } from './client';
import { PublicProfile } from '../types/api';

export async function fetchPublicProfile(userId: string): Promise<PublicProfile> {
  const res = await api.get<{ data: PublicProfile }>(`/users/${userId}/profile`);
  return unwrap(res.data);
}
