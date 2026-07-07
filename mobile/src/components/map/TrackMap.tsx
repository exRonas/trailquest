import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from '../ui';
import { colors, radius, spacing, useThemeColors } from '../../theme';
import { hasMapboxToken, mapStyleUrl } from '../../services/mapbox';
import { useT } from '../../i18n';
import { MapPlaceholder } from './MapPlaceholder';

interface LatLng {
  lat: number;
  lng: number;
}

interface TrackMapProps {
  /** The recorded GPS track to draw. */
  track: LatLng[];
  height?: number;
  interactive?: boolean;
}

type Coord = [number, number];

/**
 * Renders a recorded GPS track (the user's "tray") as a line with start/end
 * markers. Used by the run-summary overlay and the profile activity detail.
 */
export function TrackMap({
  track,
  height = 200,
  interactive = false,
}: TrackMapProps): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const cameraRef = useRef<Mapbox.Camera>(null);
  const [mapReady, setMapReady] = useState(false);
  const onMapReady = useCallback(() => setMapReady(true), []);

  const coords = useMemo<Coord[]>(
    () => track.map((p) => [p.lng, p.lat]),
    [track],
  );

  const lineShape = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: coords },
    }),
    [coords],
  );

  const endpointShape = useMemo(() => {
    const features = [];
    if (coords.length > 0) {
      features.push({
        type: 'Feature' as const,
        properties: { kind: 'start' },
        geometry: { type: 'Point' as const, coordinates: coords[0] },
      });
    }
    if (coords.length > 1) {
      features.push({
        type: 'Feature' as const,
        properties: { kind: 'end' },
        geometry: {
          type: 'Point' as const,
          coordinates: coords[coords.length - 1],
        },
      });
    }
    return { type: 'FeatureCollection' as const, features };
  }, [coords]);

  // See RoutePreviewMap for why this waits on the map actually loading
  // instead of a bare requestAnimationFrame.
  useEffect(() => {
    if (!hasMapboxToken || !mapReady || coords.length === 0) return;
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    const ne: Coord = [Math.max(...lngs), Math.max(...lats)];
    const sw: Coord = [Math.min(...lngs), Math.min(...lats)];
    cameraRef.current?.fitBounds(ne, sw, 48, 0);
  }, [coords, mapReady]);

  if (!hasMapboxToken) {
    return (
      <View style={[styles.wrap, { height }]}>
        <MapPlaceholder />
      </View>
    );
  }

  if (coords.length === 0) {
    return (
      <View style={[styles.wrap, styles.empty, { height }]}>
        <Icon name="map-marker-off-outline" size={40} color={colors.textMuted} />
        <AppText variant="callout" color={colors.textMuted} center style={styles.emptyText}>
          {t('activity.noTrack')}
        </AppText>
      </View>
    );
  }

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
          defaultSettings={{ centerCoordinate: coords[0], zoomLevel: 14 }}
        />

        <Mapbox.ShapeSource id="track-line" shape={lineShape}>
          <Mapbox.LineLayer
            id="track-line-layer"
            style={{
              lineColor: colors.accent,
              lineWidth: 5,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </Mapbox.ShapeSource>

        <Mapbox.ShapeSource id="track-endpoints" shape={endpointShape}>
          <Mapbox.CircleLayer
            id="track-endpoint-circles"
            style={{
              circleColor: [
                'match',
                ['get', 'kind'],
                'start', theme.primary,
                'end', colors.danger,
                theme.primary,
              ] as unknown as string,
              circleRadius: 7,
              circleStrokeWidth: 3,
              circleStrokeColor: colors.surface,
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
  empty: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyText: { marginTop: spacing.sm },
  map: { flex: 1 },
});
