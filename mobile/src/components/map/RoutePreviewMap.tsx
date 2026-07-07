import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { colors, radius, useThemeColors } from '../../theme';
import { hasMapboxToken, mapStyleUrl } from '../../services/mapbox';
import { MapPlaceholder } from './MapPlaceholder';
import { Checkpoint, PathPoint } from '../../types/api';

interface RoutePreviewMapProps {
  pathPoints: PathPoint[];
  checkpoints: Checkpoint[];
  /** Road-snapped line; preferred over pathPoints for drawing when present. */
  geometry?: { lat: number; lng: number }[] | null;
  height?: number;
  interactive?: boolean;
  onCheckpointPress?: (checkpointId: string) => void;
}

type Coord = [number, number];

/** Non-interactive (by default) preview of a route's polyline + checkpoints. */
export function RoutePreviewMap({
  pathPoints,
  checkpoints,
  geometry,
  height = 200,
  interactive = false,
  onCheckpointPress,
}: RoutePreviewMapProps): React.ReactElement {
  const theme = useThemeColors();
  const cameraRef = useRef<Mapbox.Camera>(null);
  const [mapReady, setMapReady] = useState(false);
  const onMapReady = useCallback(() => setMapReady(true), []);

  const coords = useMemo<Coord[]>(() => {
    if (geometry && geometry.length > 1) {
      return geometry.map((p) => [p.lng, p.lat]);
    }
    return [...pathPoints]
      .sort((a, b) => a.sequence - b.sequence)
      .map((p) => [p.lng, p.lat]);
  }, [geometry, pathPoints]);

  const lineShape = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: coords },
    }),
    [coords],
  );

  const checkpointShape = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: checkpoints.map((cp) => ({
        type: 'Feature' as const,
        id: cp.id,
        properties: { checkpointId: cp.id, type: cp.type, order: cp.orderIndex + 1 },
        geometry: { type: 'Point' as const, coordinates: [cp.lng, cp.lat] as Coord },
      })),
    }),
    [checkpoints],
  );

  // Wait for the map to actually finish loading before fitting bounds — a
  // bare requestAnimationFrame could fire before the native camera exists,
  // silently no-op, and leave the map on the style's own built-in default
  // view (e.g. Mapbox's "outdoors" style defaults to a scenic spot that has
  // nothing to do with the route — very confusing to spot as a bug).
  useEffect(() => {
    if (!hasMapboxToken || !mapReady || coords.length === 0) return;
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    const ne: Coord = [Math.max(...lngs), Math.max(...lats)];
    const sw: Coord = [Math.min(...lngs), Math.min(...lats)];
    cameraRef.current?.fitBounds(ne, sw, 50, 0);
  }, [coords, mapReady]);

  if (!hasMapboxToken) {
    return (
      <View style={[styles.wrap, { height }]}>
        <MapPlaceholder />
      </View>
    );
  }

  const typeColorMatch = [
    'match',
    ['get', 'type'],
    'HISTORICAL', colors.checkpoint.HISTORICAL.main,
    'DANGER', colors.checkpoint.DANGER.main,
    'UPCOMING', colors.checkpoint.UPCOMING.main,
    'INFO', colors.checkpoint.INFO.main,
    colors.checkpoint.INFO.main,
  ] as unknown as string;

  return (
    <View style={[styles.wrap, { height }]}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={mapStyleUrl}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        pitchEnabled={false}
        scaleBarEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
        onDidFinishLoadingMap={onMapReady}
      >
        <Mapbox.Camera
          ref={cameraRef}
          // Safety net: if fitBounds somehow never fires, at least center on
          // the route instead of the style's own unrelated default view.
          defaultSettings={
            coords.length > 0
              ? { centerCoordinate: coords[0], zoomLevel: 13 }
              : undefined
          }
        />

        <Mapbox.ShapeSource id="route-line" shape={lineShape}>
          <Mapbox.LineLayer
            id="route-line-layer"
            style={{
              lineColor: theme.primary,
              lineWidth: 4,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </Mapbox.ShapeSource>

        <Mapbox.ShapeSource
          id="route-checkpoints"
          shape={checkpointShape}
          onPress={(e) => {
            const id = e.features[0]?.properties?.checkpointId;
            if (typeof id === 'string') onCheckpointPress?.(id);
          }}
        >
          <Mapbox.CircleLayer
            id="checkpoint-circles"
            style={{
              circleColor: typeColorMatch,
              circleRadius: 11,
              circleStrokeWidth: 3,
              circleStrokeColor: colors.surface,
            }}
          />
          <Mapbox.SymbolLayer
            id="checkpoint-order"
            style={{
              textField: ['get', 'order'],
              textSize: 11,
              textColor: colors.textInverse,
              textFont: ['Open Sans Bold', 'Arial Unicode MS Bold'],
              textAllowOverlap: true,
            }}
          />
        </Mapbox.ShapeSource>
      </Mapbox.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  map: { flex: 1 },
});
