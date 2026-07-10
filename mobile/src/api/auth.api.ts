import { api, unwrap } from './client';
import { AuthResponse, User } from '../types/api';

export async function registerRequest(input: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResponse> {
  const res = await api.post<{ data: AuthResponse }>('/auth/register', input);
  return unwrap(res.data);
}

export async function loginRequest(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await api.post<{ data: AuthResponse }>('/auth/login', input);
  return unwrap(res.data);
}

export async function fetchMe(): Promise<User> {
  const res = await api.get<{ data: User }>('/auth/me');
  return unwrap(res.data);
}

export async function forgotPasswordRequest(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPasswordRequest(
  token: string,
  password: string,
): Promise<void> {
  await api.post('/auth/reset-password', { token, password });
}
