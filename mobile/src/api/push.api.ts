import { api } from './client';

export async function registerPushTokenRequest(
  token: string,
  platform: 'android' | 'ios' = 'android',
): Promise<void> {
  await api.post('/push/register', { token, platform });
}

export async function unregisterPushTokenRequest(token: string): Promise<void> {
  await api.post('/push/unregister', { token });
}
