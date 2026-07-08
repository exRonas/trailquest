import { api, unwrap } from './client';
import { AnalyticsData } from '../types';

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await api.get<{ data: AnalyticsData }>('/admin/analytics');
  return unwrap(res.data);
}
