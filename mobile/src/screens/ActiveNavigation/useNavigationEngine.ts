import { useCallback, useEffect, useRef, useState } from 'react';
import { LocationSample, startTracking } from '../../services/geolocation';
import { requestNavigationPermissions } from '../../services/permissions';
import {
  logPoints,
  scanCheckpoint,
  completeRoute,
} from '../../api/progress.api';
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

  const flush = useCallback(async () => {
    if (pendingRef.current.length === 0) return;
    const batch = pendingRef.current;
    pendingRef.current = [];
    try {
      await logPoints(progressId, batch);
    } catch {
      // Re-queue on failure so points aren't lost; next flush retries.
      pendingRef.current = [...batch, ...pendingRef.current];
    }
  }, [progressId]);

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

      // Buffer + batch-sync the path log.
      pendingRef.current.push({
        lat: sample.lat,
        lng: sample.lng,
        speedKmh,
        timestamp: new Date(t).toISOString(),
      });
      if (pendingRef.current.length >= BATCH_SIZE) void flush();
    },
    [flush, checkpointFraction, route.estimatedMinutes],
  );

  // Scan a checkpoint QR. On success records the checkpoint locally (for map +
  // progress) and returns the full scan result so the UI can show the card.
  const scan = useCallback(
    async (qrCode: string): Promise<ScanResult> => {
      const result = await scanCheckpoint(progressId, qrCode);
      reachedRef.current.add(result.checkpoint.orderIndex);
      setReachedIndices(Array.from(reachedRef.current));
      setStats((s) => ({ ...s, progressFraction: checkpointFraction() }));
      return result;
    },
    [progressId, checkpointFraction],
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
    try {
      const progress = await completeRoute(progressId);
      await stopRef.current?.();
      stopRef.current = null;
      setStatus('completed');
      return progress;
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to complete route',
      );
      setStatus('tracking');
      return null;
    }
  }, [flush, progressId]);

  return {
    status,
    errorMessage,
    position,
    stats,
    reachedIndices,
    reachedCount: reachedIndices.length,
    totalCheckpoints,
    scan,
    complete,
  };
}
