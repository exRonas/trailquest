import { api, unwrap, setTokens } from './client';
import { User } from '../types';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export async function login(email: string, password: string): Promise<User> {
  const res = await api.post<{ data: AuthResponse }>('/auth/login', {
    email,
    password,
  });
  const auth = unwrap(res.data);
  setTokens(auth.accessToken, auth.refreshToken);
  return auth.user;
}

export async function fetchMe(): Promise<User> {
  const res = await api.get<{ data: User }>('/auth/me');
  return unwrap(res.data);
}
