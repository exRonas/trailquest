import Mapbox from '@rnmapbox/maps';
import { mapStyleUrl } from './mapbox';

type Coord = [number, number]; // [lng, lat]

/** Degrees of padding around a route's bounds so the offline pack covers a
 *  little context (nearby streets/landmarks), not just the exact line. */
const BOUNDS_PADDING_DEG = 0.01; // ~1km at these latitudes

/** Detailed enough for on-trail navigation without downloading a huge pack. */
const MIN_ZOOM = 10;
const MAX_ZOOM = 16;

export function packNameForRoute(routeId: string): string {
  return `route-${routeId}`;
}

/** Bounding box (NE, SW) around every coordinate, padded for context. */
export function computeBounds(coords: Coord[]): [Coord, Coord] | null {
  if (coords.length === 0) return null;
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  const ne: Coord = [Math.max(...lngs) + BOUNDS_PADDING_DEG, Math.max(...lats) + BOUNDS_PADDING_DEG];
  const sw: Coord = [Math.min(...lngs) - BOUNDS_PADDING_DEG, Math.min(...lats) - BOUNDS_PADDING_DEG];
  return [ne, sw];
}

export interface OfflineMapProgress {
  percentage: number;
  /** True once the pack is fully downloaded. */
  complete: boolean;
}

/** Current download state for a route's offline pack, or null if none exists. */
export async function getOfflineMapStatus(routeId: string): Promise<OfflineMapProgress | null> {
  const pack = await Mapbox.offlineManager.getPack(packNameForRoute(routeId));
  if (!pack) return null;
  const status = await pack.status();
  return { percentage: status.percentage, complete: status.percentage >= 100 };
}

/**
 * Download the map tiles covering a route's bounds so navigation still shows
 * a map with no connection (GPS/checkpoints already work offline regardless —
 * this is purely about the visual map tiles). Resolves once complete.
 */
export async function downloadOfflineMap(
  routeId: string,
  coords: Coord[],
  onProgress: (percentage: number) => void,
): Promise<void> {
  const bounds = computeBounds(coords);
  if (!bounds) throw new Error('Route has no coordinates to download');

  const existing = await Mapbox.offlineManager.getPack(packNameForRoute(routeId));
  if (existing) {
    await Mapbox.offlineManager.deletePack(packNameForRoute(routeId));
  }

  return new Promise((resolve, reject) => {
    Mapbox.offlineManager
      .createPack(
        {
          name: packNameForRoute(routeId),
          styleURL: mapStyleUrl,
          bounds,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
        },
        (_pack, status) => {
          onProgress(status.percentage);
          if (status.percentage >= 100) resolve();
        },
        (_pack, err) => reject(new Error(err.message)),
      )
      .catch(reject);
  });
}

export async function deleteOfflineMap(routeId: string): Promise<void> {
  await Mapbox.offlineManager.deletePack(packNameForRoute(routeId));
}
