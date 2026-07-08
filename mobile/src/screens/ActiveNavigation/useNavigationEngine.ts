import { useCallback, useEffect, useRef, useState } from 'react';
import { LocationSample, startTracking } from '../../services/geolocation';
import { requestNavigationPermissions } from '../../services/permissions';
import {
  logPoints,
  scanCheckpoint,
  completeRoute,
} from '../../api/progress.api';
import { isNetworkError } from '../../api/client';
import * as offlineQueue from '../../services/offlineQueue';
import {
  PathLogPoint,
  RouteDetail,
  ScanResult,
  UserRouteProgress,
} from '../../types/api';
import { haversineMeters, smoothedSpeedKmh, TimedPoint } from '../../utils/geo';
import { estimateMinutesRemaining } from '../../utils/format';

export type EngineStatus =
  | 'requesting'
  | 'denied'
  | 'tracking'
  | 'completing'
  | 'completed'
  | 'error';

export interface LiveStats {
  distanceKm: number;
  speedKmh: number;
  progressFraction: number;
  etaMinutes: number;
  elapsedSeconds: number;
}

interface EngineArgs {
  route: RouteDetail;
  /** Server progress id, or a `local-...` id when even the start call
   *  couldn't reach the server (see RouteDetailScreen). */
  progressId: string;
  /** Checkpoint order-indices already scanned in a resumed session. */
  initialReachedIndices?: number[];
}

const BATCH_SIZE = 5; // GPS samples buffered before syncing to the server

const ZERO_STATS: LiveStats = {
  distanceKm: 0,
  speedKmh: 0,
  progressFraction: 0,
  etaMinutes: 0,
  elapsedSeconds: 0,
};

/**
 * Owns the live navigation lifecycle: permissions, foreground GPS tracking, live
 * stat derivation, batched syncing of the path log, and QR checkpoint scanning.
 *
 * Checkpoints are no longer auto-triggered by proximity — they're marked by
 * scanning their physical QR (see `scan`). Progress is therefore checkpoint-
 * based: fraction = scanned / total.
 *
 * Offline-first: every server call here (log/scan/complete) falls back to
 * `offlineQueue` when there's no connection, so a hike with no signal still
 * tracks distance/checkpoints/completion locally and syncs automatically
 * once back online (see RootNavigator's sync trigger). `route.checkpoints`
 * already carries each checkpoint's `qrCode` (same payload the admin/scan
 * flow always exposed), so a scanned code can be matched to a checkpoint
 * entirely client-side without the server.
 */
export function useNavigationEngine({
  route,
  progressId,
  initialReachedIndices,
}: EngineArgs) {
  const totalCheckpoints = route.checkpoints.length;

  const [status, setStatus] = useState<EngineStatus>('requesting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [position, setPosition] = useState<LocationSample | null>(null);
  const [stats, setStats] = useState<LiveStats>({
    ...ZERO_STATS,
    progressFraction:
      totalCheckpoints > 0
        ? (initialReachedIndices?.length ?? 0) / totalCheckpoints
        : 0,
  });
  const [reachedIndices, setReachedIndices] = useState<number[]>(
    initialReachedIndices ?? [],
  );

  // Mutable accumulators kept in refs so the location callback isn't re-created
  // and we avoid re-rendering on every raw sample.
  const samplesRef = useRef<TimedPoint[]>([]);
  const allPointsRef = useRef<PathLogPoint[]>([]);
  const distanceMRef = useRef(0);
  const startTimeRef = useRef<number>(Date.now());
  const reachedRef = useRef<Set<number>>(new Set(initialReachedIndices ?? []));
  const pendingRef = useRef<PathLogPoint[]>([]);
  const stopRef = useRef<(() => Promise<void>) | null>(null);
  const mountedRef = useRef(true);
  const flushRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const handleLocationRef = useRef<
    ((sample: LocationSample) => void) | undefined
  >(undefined);
  // The real server progress id once known — null while an offline-started
  // session hasn't reached the server yet.
  const serverIdRef = useRef<string | null>(
    offlineQueue.isLocalKey(progressId) ? null : progressId,
  );

  // If resuming a session that was already queued (app restarted mid-hike
  // before it synced), pick up whatever serverId a prior partial sync found.
  useEffect(() => {
    if (!offlineQueue.isLocalKey(progressId)) return;
    (async () => {
      const session = await offlineQueue.getSession(progressId);
      if (session?.serverId) serverIdRef.current = session.serverId;
    })();
  }, [progressId]);

  const flush = useCallback(async () => {
    if (pendingRef.current.length === 0) return;
    const batch = pendingRef.current;
    pendingRef.current = [];

    const serverId = serverIdRef.current;
    if (serverId) {
      try {
        await logPoints(serverId, batch);
        return;
      } catch (err) {
        if (!isNetworkError(err)) {
          // Non-network rejection (e.g. session gone) — nothing to retry.
          return;
        }
        // Network failure: fall through to the offline queue below.
      }
    }

    await offlineQueue.getOrCreateSession(progressId, route.id, serverId);
    await offlineQueue.appendPoints(progressId, batch);
  }, [progressId, route.id]);

  const checkpointFraction = useCallback(
    () => (totalCheckpoints > 0 ? reachedRef.current.size / totalCheckpoints : 0),
    [totalCheckpoints],
  );

  const handleLocation = useCallback(
    (sample: LocationSample) => {
      const t = Date.parse(sample.timestamp) || Date.now();
      const point: TimedPoint = { lat: sample.lat, lng: sample.lng, t };

      // Distance: add the leg from the previous sample.
      const prev = samplesRef.current[samplesRef.current.length - 1];
      if (prev) {
        distanceMRef.current += haversineMeters(prev, point);
      }
      samplesRef.current.push(point);
      // Cap retained samples to keep speed smoothing cheap.
      if (samplesRef.current.length > 40) samplesRef.current.shift();

      setPosition(sample);

      const speedFromGps =
        sample.speedMps != null ? sample.speedMps * 3.6 : null;
      const speedKmh =
        speedFromGps != null && speedFromGps >= 0
          ? speedFromGps
          : smoothedSpeedKmh(samplesRef.current);

      const fraction = checkpointFraction();
      const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
      setStats({
        distanceKm: distanceMRef.current / 1000,
        speedKmh,
        progressFraction: fraction,
        etaMinutes: estimateMinutesRemaining(
          fraction,
          route.estimatedMinutes,
          elapsedSeconds,
        ),
        elapsedSeconds,
      });

      const logPoint: PathLogPoint = {
        lat: sample.lat,
        lng: sample.lng,
        speedKmh,
        timestamp: new Date(t).toISOString(),
      };
      // Kept in full regardless of sync state, so a route completed with no
      // connection can still show its track in the run summary.
      allPointsRef.current.push(logPoint);
      // Buffer + batch-sync the path log.
      pendingRef.current.push(logPoint);
      if (pendingRef.current.length >= BATCH_SIZE) void flush();
    },
    [flush, checkpointFraction, route.estimatedMinutes],
  );

  // Scan a checkpoint QR. Matches the code against this route's checkpoints
  // client-side first (the route payload already carries each qrCode), then
  // tries the server; falls back to the offline queue on a network failure.
  const scan = useCallback(
    async (qrCode: string): Promise<ScanResult> => {
      const cp = route.checkpoints.find((c) => c.qrCode === qrCode);
      if (!cp) {
        throw new Error('Invalid checkpoint code');
      }

      const serverId = serverIdRef.current;
      if (serverId) {
        try {
          const result = await scanCheckpoint(serverId, qrCode);
          reachedRef.current.add(result.checkpoint.orderIndex);
          setReachedIndices(Array.from(reachedRef.current));
          setStats((s) => ({ ...s, progressFraction: checkpointFraction() }));
          return result;
        } catch (err) {
          if (!isNetworkError(err)) throw err;
          // Network failure: fall through to the offline queue below.
        }
      }

      const alreadyReached = reachedRef.current.has(cp.orderIndex);
      await offlineQueue.getOrCreateSession(progressId, route.id, serverId);
      if (!alreadyReached) {
        await offlineQueue.appendScan(progressId, {
          qrCode,
          checkpointId: cp.id,
          orderIndex: cp.orderIndex,
          scannedAt: new Date().toISOString(),
          synced: false,
        });
      }
      reachedRef.current.add(cp.orderIndex);
      setReachedIndices(Array.from(reachedRef.current));
      setStats((s) => ({ ...s, progressFraction: checkpointFraction() }));

      return {
        alreadyScanned: alreadyReached,
        checkpoint: {
          id: cp.id,
          routeId: cp.routeId,
          name: cp.name,
          type: cp.type,
          lat: cp.lat,
          lng: cp.lng,
          altitudeM: cp.altitudeM,
          radiusTriggerM: cp.radiusTriggerM,
          description: cp.description,
          mediaUrl: cp.mediaUrl,
          orderIndex: cp.orderIndex,
        },
        xpAwarded: 0,
        bonusAwarded: 0,
        reachedCount: reachedRef.current.size,
        totalCheckpoints,
        allScanned: reachedRef.current.size === totalCheckpoints,
        country: { ru: '', en: '', kk: '' },
        level: {
          level: 0,
          rank: { ru: '', en: '', kk: '' },
          xp: 0,
          xpIntoLevel: 0,
          xpForNextLevel: null,
          progress: 0,
        },
        pending: true,
      };
    },
    [progressId, route.checkpoints, route.id, totalCheckpoints, checkpointFraction],
  );

  // Keep refs pointed at the latest callbacks so the start-tracking effect
  // below can run exactly once on mount without restarting GPS/permissions
  // every time the caller's props re-render.
  flushRef.current = flush;
  handleLocationRef.current = handleLocation;

  // Start tracking once, after permissions.
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        setStatus('requesting');
        const perms = await requestNavigationPermissions();
        if (perms.location === 'denied') {
          if (!cancelled) setStatus('denied');
          return;
        }
        startTimeRef.current = Date.now();
        const stop = await startTracking(
          (sample) => handleLocationRef.current?.(sample),
          () => {},
        );
        if (cancelled) {
          await stop();
          return;
        }
        stopRef.current = stop;
        setStatus('tracking');
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Failed to start tracking',
          );
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      void flushRef.current?.();
      void stopRef.current?.();
    };
    // Intentionally run once: GPS/permission start-up must not restart on
    // every render (handleLocation/flush identity churns with route state).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1-second tick so elapsed time / ETA advance even when stationary.
  useEffect(() => {
    if (status !== 'tracking') return undefined;
    const id = setInterval(() => {
      setStats((s) => {
        const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
        return {
          ...s,
          elapsedSeconds,
          etaMinutes: estimateMinutesRemaining(
            s.progressFraction,
            route.estimatedMinutes,
            elapsedSeconds,
          ),
        };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [status, route.estimatedMinutes]);

  const complete = useCallback(async (): Promise<UserRouteProgress | null> => {
    setStatus('completing');
    await flush();

    const serverId = serverIdRef.current;
    if (serverId) {
      try {
        const progress = await completeRoute(serverId);
        await stopRef.current?.();
        stopRef.current = null;
        setStatus('completed');
        return progress;
      } catch (err) {
        if (!isNetworkError(err)) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Failed to complete route',
          );
          setStatus('tracking');
          return null;
        }
        // Network failure: fall through to the offline queue below.
      }
    }

    const localStats = {
      totalDistanceKm: Number((distanceMRef.current / 1000).toFixed(3)),
      movingSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
    };
    await offlineQueue.getOrCreateSession(progressId, route.id, serverId);
    await offlineQueue.markCompleted(progressId, localStats);
    const session = await offlineQueue.getSession(progressId);
    await stopRef.current?.();
    stopRef.current = null;
    setStatus('completed');

    return {
      id: progressId,
      userId: '',
      routeId: route.id,
      startedAt: session?.startedAt ?? new Date().toISOString(),
      completedAt: session?.completedAt ?? new Date().toISOString(),
      hidden: false,
      lastCheckpointIndex: reachedRef.current.size,
      totalDistanceKm: localStats.totalDistanceKm,
      movingSeconds: localStats.movingSeconds,
      pathLog: allPointsRef.current,
    };
  }, [flush, progressId, route.id]);

  return {
    status,
    errorMessage,
    position,
    stats,
    reachedIndices,
    reachedCount: reachedIndices.length,
    totalCheckpoints,
    isOffline: !serverIdRef.current,
    scan,
    complete,
  };
}
