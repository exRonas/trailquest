import { api, unwrap } from './client';
import { AppVersionInfo } from '../types/api';

export async function fetchAppVersion(): Promise<AppVersionInfo> {
  const res = await api.get<{ data: AppVersionInfo }>('/app-version');
  return unwrap(res.data);
}
