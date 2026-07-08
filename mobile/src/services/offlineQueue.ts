import AsyncStorage from '@react-native-async-storage/async-storage';
import { isNetworkError } from '../api/client';
import { logPoints, scanCheckpoint, startRoute, completeRoute } from '../api/progress.api';
import { PathLogPoint } from '../types/api';

/**
 * Local-first fallback for the three server-authoritative navigation calls
 * (start/scan/complete). GPS tracking and the map already work with no
 * signal; without this, scanning a checkpoint or finishing a route with no
 * connection would just fail outright and lose the attempt. Every write here
 * is queued under a session key and replayed in order once connectivity
 * returns (NetInfo/AppState trigger `syncAll`, see RootNavigator).
 *
 * A session's key is either:
 *  - a real server progress id (an online session whose *later* call, e.g. a
 *    scan mid-hike, happened to fail — logPoints/scan/complete degrade to the
 *    queue individually), or
 *  - a `local-<...>` id minted here when even the initial `start` call fails.
 * `serverId` on the record tracks the real id once `start` succeeds, so
 * everything queued under a local key gets replayed against the right id.
 */

const STORAGE_KEY = 'tq_offline_sessions_v1';

export interface PendingScan {
  qrCode: string;
  checkpointId: string;
  orderIndex: number;
  scannedAt: string;
  synced: boolean;
}

export interface PendingSession {
  /** Storage key: a real progress id, or a local-only placeholder. */
  key: string;
  routeId: string;
  /** Set once the start call (or the original online start) is confirmed. */
  serverId: string | null;
  startedAt: string;
  /** GPS points not yet flushed to the server. */
  pendingPoints: PathLogPoint[];
  /** Every point recorded this session — only needed to build a local track
   *  if the route gets completed while still offline. */
  allPoints: PathLogPoint[];
  scans: PendingScan[];
  completed: boolean;
  completedAt: string | null;
  totalDistanceKm: number;
  movingSeconds: number;
}

function isLocalKey(key: string): boolean {
  return key.startsWith('local-');
}

export function makeLocalKey(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function loadAll(): Promise<Record<string, PendingSession>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, PendingSession>;
  } catch {
    return {};
  }
}

async function saveAll(sessions: Record<string, PendingSession>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

/** Start (or find) a locally-tracked session for a route that hasn't
 *  finished syncing — used both to create a brand-new offline session and to
 *  lazily register one when an otherwise-online session's later call fails. */
export async function getOrCreateSession(
  key: string,
  routeId: string,
  serverId: string | null,
): Promise<PendingSession> {
  const all = await loadAll();
  const existing = all[key];
  if (existing) return existing;
  const session: PendingSession = {
    key,
    routeId,
    serverId,
    startedAt: new Date().toISOString(),
    pendingPoints: [],
    allPoints: [],
    scans: [],
    completed: false,
    completedAt: null,
    totalDistanceKm: 0,
    movingSeconds: 0,
  };
  all[key] = session;
  await saveAll(all);
  return session;
}

/** An incomplete session for this route, if one is still waiting to sync —
 *  callers should resume it instead of starting a duplicate. */
export async function findActiveSessionForRoute(
  routeId: string,
): Promise<PendingSession | null> {
  const all = await loadAll();
  return (
    Object.values(all).find((s) => s.routeId === routeId && !s.completed) ?? null
  );
}

export async function appendPoints(key: string, points: PathLogPoint[]): Promise<void> {
  const all = await loadAll();
  const session = all[key];
  if (!session) return;
  session.pendingPoints.push(...points);
  session.allPoints.push(...points);
  await saveAll(all);
}

export async function appendScan(key: string, scan: PendingScan): Promise<void> {
  const all = await loadAll();
  const session = all[key];
  if (!session) return;
  if (session.scans.some((s) => s.checkpointId === scan.checkpointId)) return;
  session.scans.push(scan);
  await saveAll(all);
}

export async function markCompleted(
  key: string,
  stats: { totalDistanceKm: number; movingSeconds: number },
): Promise<void> {
  const all = await loadAll();
  const session = all[key];
  if (!session) return;
  session.completed = true;
  session.completedAt = new Date().toISOString();
  session.totalDistanceKm = stats.totalDistanceKm;
  session.movingSeconds = stats.movingSeconds;
  await saveAll(all);
}

export async function getSession(key: string): Promise<PendingSession | null> {
  const all = await loadAll();
  return all[key] ?? null;
}

export async function pendingCount(): Promise<number> {
  const all = await loadAll();
  return Object.keys(all).length;
}

/** Attempt to fully sync one session against the server. Returns true if it's
 *  now fully synced (safe to drop from the queue). Never throws — a failed
 *  step just leaves the session queued for the next sync pass. */
async function syncSession(all: Record<string, PendingSession>, key: string): Promise<boolean> {
  const session = all[key];
  if (!session) return true;

  // Step 1: make sure the session exists server-side.
  if (!session.serverId) {
    try {
      const progress = await startRoute(session.routeId);
      session.serverId = progress.id;
      await saveAll(all);
    } catch (err) {
      if (isNetworkError(err)) return false;
      // Server rejected it outright (route deleted, etc) — nothing more we
      // can do with this session; drop it rather than retry forever.
      return true;
    }
  }
  const serverId = session.serverId;

  // Step 2: flush accumulated GPS points.
  if (session.pendingPoints.length > 0) {
    try {
      await logPoints(serverId, session.pendingPoints);
      session.pendingPoints = [];
      await saveAll(all);
    } catch (err) {
      if (isNetworkError(err)) return false;
      session.pendingPoints = [];
    }
  }

  // Step 3: replay scans in order — the server dedupes by checkpoint, so a
  // scan that already went through before a mid-sync failure is a safe no-op.
  const sortedScans = [...session.scans].sort((a, b) => a.orderIndex - b.orderIndex);
  for (const scan of sortedScans) {
    if (scan.synced) continue;
    try {
      // eslint-disable-next-line no-await-in-loop
      await scanCheckpoint(serverId, scan.qrCode);
      scan.synced = true;
      // eslint-disable-next-line no-await-in-loop
      await saveAll(all);
    } catch (err) {
      if (isNetworkError(err)) return false;
      scan.synced = true; // server rejected it (e.g. stale code) — don't retry forever
    }
  }

  // Step 4: complete, if the user finished the route while offline.
  if (session.completed) {
    try {
      await completeRoute(serverId);
    } catch (err) {
      if (isNetworkError(err)) return false;
      // Already completed server-side or otherwise rejected — either way,
      // nothing left to retry.
    }
  }

  return true;
}

/** Sync every queued session; call on reconnect/app-foreground. Safe to call
 *  often — no-ops quickly when the queue is empty or still offline. */
export async function syncAll(): Promise<{ synced: number; remaining: number }> {
  const all = await loadAll();
  const keys = Object.keys(all);
  let synced = 0;
  for (const key of keys) {
    // eslint-disable-next-line no-await-in-loop
    const done = await syncSession(all, key);
    if (done) {
      delete all[key];
      synced += 1;
    }
  }
  await saveAll(all);
  return { synced, remaining: Object.keys(all).length };
}

export { isLocalKey };
