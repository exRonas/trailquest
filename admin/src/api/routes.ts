import { api, unwrap } from './client';
import { FullRoutePayload, RouteDetail, RouteSummary } from '../types';

export async function fetchRoutes(): Promise<RouteSummary[]> {
  const res = await api.get<{ data: RouteSummary[] }>('/routes');
  return unwrap(res.data);
}

export async function fetchRoute(id: string): Promise<RouteDetail> {
  const res = await api.get<{ data: RouteDetail }>(`/routes/${id}`);
  return unwrap(res.data);
}

export async function createRoute(payload: FullRoutePayload): Promise<RouteDetail> {
  const res = await api.post<{ data: RouteDetail }>('/routes', payload);
  return unwrap(res.data);
}

export async function replaceRoute(
  id: string,
  payload: FullRoutePayload,
): Promise<RouteDetail> {
  const res = await api.put<{ data: RouteDetail }>(`/routes/${id}`, payload);
  return unwrap(res.data);
}

export async function deleteRoute(id: string): Promise<void> {
  await api.delete(`/routes/${id}`);
}
