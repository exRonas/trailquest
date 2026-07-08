import { api, unwrap } from './client';
import {
  Achievement,
  CountryLevel,
  LeaderboardResponse,
  LevelInfo,
  PathLogPoint,
  ProgressWithRoute,
  ScanResult,
  UserRouteProgress,
} from '../types/api';

export async function startRoute(routeId: string): Promise<UserRouteProgress> {
  const res = await api.post<{ data: UserRouteProgress }>(
    `/routes/${routeId}/start`,
  );
  return unwrap(res.data);
}

export async function logPoints(
  progressId: string,
  points: PathLogPoint[],
): Promise<UserRouteProgress> {
  const res = await api.patch<{ data: UserRouteProgress }>(
    `/progress/${progressId}/log`,
    { points },
  );
  return unwrap(res.data);
}

export async function markCheckpointReached(
  progressId: string,
  checkpointIndex: number,
): Promise<UserRouteProgress> {
  const res = await api.patch<{ data: UserRouteProgress }>(
    `/progress/${progressId}/checkpoint-reached`,
    { checkpointIndex },
  );
  return unwrap(res.data);
}

export async function scanCheckpoint(
  progressId: string,
  qrCode: string,
): Promise<ScanResult> {
  const res = await api.patch<{ data: ScanResult }>(
    `/progress/${progressId}/scan`,
    { qrCode },
  );
  return unwrap(res.data);
}

export async function fetchMyLevels(): Promise<CountryLevel[]> {
  const res = await api.get<{ data: CountryLevel[] }>('/progress/levels');
  return unwrap(res.data);
}

/** Overall level (total XP across countries) for the profile header. */
export async function fetchMyLevel(): Promise<LevelInfo> {
  const res = await api.get<{ data: LevelInfo }>('/progress/level');
  return unwrap(res.data);
}

export async function fetchAchievements(): Promise<Achievement[]> {
  const res = await api.get<{ data: Achievement[] }>('/progress/achievements');
  return unwrap(res.data);
}

export type LeaderboardPeriod = 'all' | 'month';

export async function fetchLeaderboard(
  period: LeaderboardPeriod = 'all',
): Promise<LeaderboardResponse> {
  const res = await api.get<{ data: LeaderboardResponse }>(
    '/progress/leaderboard',
    { params: { period } },
  );
  return unwrap(res.data);
}

export async function completeRoute(
  progressId: string,
  points?: PathLogPoint[],
): Promise<UserRouteProgress> {
  const res = await api.patch<{ data: UserRouteProgress }>(
    `/progress/${progressId}/complete`,
    points ? { points } : {},
  );
  return unwrap(res.data);
}

export async function fetchMyProgress(): Promise<ProgressWithRoute[]> {
  const res = await api.get<{ data: ProgressWithRoute[] }>('/progress');
  return unwrap(res.data);
}

export async function setProgressVisibility(
  progressId: string,
  hidden: boolean,
): Promise<UserRouteProgress> {
  const res = await api.patch<{ data: UserRouteProgress }>(
    `/progress/${progressId}/visibility`,
    { hidden },
  );
  return unwrap(res.data);
}

export async function deleteProgress(progressId: string): Promise<void> {
  await api.delete(`/progress/${progressId}`);
}
