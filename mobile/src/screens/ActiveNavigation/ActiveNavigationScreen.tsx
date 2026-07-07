import React, { useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Mapbox from '@rnmapbox/maps';
import {
  AppText,
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  Loader,
  ProgressBar,
} from '../../components/ui';
import { StatTile } from '../../components/StatTile';
import { CheckpointModal } from '../../components/CheckpointModal';
import { RunSummaryOverlay } from '../../components/RunSummaryOverlay';
import { ScanResultCard } from '../../components/ScanResultCard';
import { QRScannerModal } from '../../components/QRScannerModal';
import { colors, shadow, spacing } from '../../theme';
import { hasMapboxToken, mapStyleUrl } from '../../services/mapbox';
import { MapPlaceholder } from '../../components/map/MapPlaceholder';
import {
  formatClock,
  formatDistanceKm,
  formatDuration,
  formatSpeed,
} from '../../utils/format';
import { useRouteDetail } from '../../api/hooks/useRoutes';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryClient';
import { getApiErrorMessage } from '../../api/client';
import { useT, usePickLocalized, useLocaleStore } from '../../i18n';
import { useNavigationEngine } from './useNavigationEngine';
import {
  Checkpoint,
  RouteDetail,
  ScanResult,
  UserRouteProgress,
} from '../../types/api';
import { ExploreScreenProps } from '../../types/navigation';

export function ActiveNavigationScreen(
  props: ExploreScreenProps<'ActiveNavigation'>,
): React.ReactElement {
  const { routeId } = props.route.params;
  const t = useT();
  const { data, isLoading, isError, error, refetch } = useRouteDetail(routeId);

  if (isLoading) return <Loader message={t('route.loading')} />;
  if (isError || !data) {
    return (
      <ErrorState
        message={getApiErrorMessage(error, t('route.loading'))}
        onRetry={refetch}
      />
    );
  }
  return (
    <NavigationActive
      route={data}
      navigation={props.navigation}
      progressId={props.route.params.progressId}
      initialReachedIndices={props.route.params.reachedOrderIndices}
    />
  );
}

type Modal = { checkpoint: Checkpoint; triggered: boolean } | null;
type Coord = [number, number];
type NavProp = ExploreScreenProps<'ActiveNavigation'>['navigation'];

function NavigationActive({
  route,
  navigation,
  progressId,
  initialReachedIndices,
}: {
  route: RouteDetail;
  navigation: NavProp;
  progressId: string;
  initialReachedIndices?: number[];
}): React.ReactElement {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const t = useT();
  const pickLocalized = usePickLocalized();
  const language = useLocaleStore((s) => s.language);
  const [modal, setModal] = useState<Modal>(null);
  const [summary, setSummary] = useState<UserRouteProgress | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const engine = useNavigationEngine({ route, progressId, initialReachedIndices });

  const onScanned = async (code: string) => {
    setScannerOpen(false);
    try {
      const result = await engine.scan(code);
      setScanResult(result);
      qc.invalidateQueries({ queryKey: queryKeys.myLevels() });
    } catch (err) {
      Alert.alert(t('scan.failedTitle'), getApiErrorMessage(err));
    }
  };

  const lineShape = useMemo(() => {
    const coords =
      route.routeGeometry && route.routeGeometry.length > 1
        ? route.routeGeometry.map((p) => [p.lng, p.lat] as Coord)
        : [...route.pathPoints]
            .sort((a, b) => a.sequence - b.sequence)
            .map((p) => [p.lng, p.lat] as Coord);
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: coords },
    };
  }, [route.routeGeometry, route.pathPoints]);

  const checkpointShape = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: route.checkpoints.map((cp) => ({
        type: 'Feature' as const,
        id: cp.id,
        properties: {
          checkpointId: cp.id,
          type: cp.type,
          reached: engine.reachedIndices.includes(cp.orderIndex),
        },
        geometry: { type: 'Point' as const, coordinates: [cp.lng, cp.lat] as Coord },
      })),
    }),
    [route.checkpoints, engine.reachedIndices],
  );

  // Finish → complete the session, then float the summary card over the screen.
  const onFinish = async () => {
    const progress = await engine.complete();
    if (progress) {
      qc.invalidateQueries({ queryKey: queryKeys.myProgress() });
      setSummary(progress);
    }
  };

  // Both "save" and "close" on the summary go straight to the Profile tab, and
  // reset the Explore stack so returning to Explore lands on the list (not the
  // now-finished navigation screen).
  const goToProfile = () => {
    setSummary(null);
    navigation.popToTop();
    navigation.navigate('ProfileTab', { screen: 'Profile' });
  };

  const onExit = () => {
    Alert.alert(t('nav.stopTitle'), t('nav.stopMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('nav.stop'), style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  if (engine.status === 'requesting') {
    return <Loader message={t('nav.requesting')} />;
  }

  if (engine.status === 'denied') {
    return (
      <View style={styles.fill}>
        <EmptyState
          icon="map-marker-off-outline"
          title={t('nav.deniedTitle')}
          message={t('nav.deniedMsg')}
          actionLabel={t('nav.openSettings')}
          onAction={() => Linking.openSettings()}
        />
        <View style={[styles.exitDenied, { bottom: insets.bottom + spacing.lg }]}>
          <Button label={t('common.goBack')} variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  if (engine.status === 'error') {
    return (
      <ErrorState
        title={t('nav.trackingErrorTitle')}
        message={engine.errorMessage ?? t('nav.trackingErrorMsg')}
        onRetry={() => navigation.goBack()}
      />
    );
  }

  const reachedColor = colors.success;
  const typeColorMatch = [
    'case',
    ['get', 'reached'],
    reachedColor,
    [
      'match',
      ['get', 'type'],
      'HISTORICAL', colors.checkpoint.HISTORICAL.main,
      'DANGER', colors.checkpoint.DANGER.main,
      'UPCOMING', colors.checkpoint.UPCOMING.main,
      'INFO', colors.checkpoint.INFO.main,
      colors.checkpoint.INFO.main,
    ],
  ] as unknown as string;

  return (
    <View style={styles.fill}>
      {hasMapboxToken ? (
        <Mapbox.MapView
          style={styles.map}
          styleURL={mapStyleUrl}
          scaleBarEnabled={false}
          logoPosition={{ bottom: 8, left: 8 }}
        >
          <Mapbox.Camera
            followUserLocation
            followUserMode={'compass' as never}
            followZoomLevel={16}
          />
          <Mapbox.UserLocation visible showsUserHeadingIndicator androidRenderMode="compass" />

          <Mapbox.ShapeSource id="nav-line" shape={lineShape}>
            <Mapbox.LineLayer
              id="nav-line-layer"
              style={{
                lineColor: colors.primary,
                lineWidth: 5,
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 0.85,
              }}
            />
          </Mapbox.ShapeSource>

          <Mapbox.ShapeSource
            id="nav-checkpoints"
            shape={checkpointShape}
            onPress={(e) => {
              const id = e.features[0]?.properties?.checkpointId;
              const cp = route.checkpoints.find((c) => c.id === id);
              if (cp) setModal({ checkpoint: cp, triggered: false });
            }}
          >
            <Mapbox.CircleLayer
              id="nav-checkpoint-circles"
              style={{
                circleColor: typeColorMatch,
                circleRadius: 10,
                circleStrokeWidth: 3,
                circleStrokeColor: colors.surface,
                // Reached checkpoints fade slightly so the checkmark reads as
                // "done" at a glance, not just a different color.
                circleOpacity: ['case', ['get', 'reached'], 0.55, 1],
              }}
            />
            <Mapbox.SymbolLayer
              id="nav-checkpoint-check"
              filter={['get', 'reached']}
              style={{
                textField: '✓',
                textSize: 13,
                textColor: colors.textInverse,
                textAllowOverlap: true,
                textIgnorePlacement: true,
              }}
            />
          </Mapbox.ShapeSource>
        </Mapbox.MapView>
      ) : (
        <MapPlaceholder />
      )}

      {/* Top stats HUD */}
      <View style={[styles.hud, { top: insets.top + spacing.sm }]}>
        <View style={styles.hudRow}>
          <StatTile
            icon="speedometer"
            value={formatSpeed(engine.stats.speedKmh)}
            label={t('nav.speed')}
            emphasis
          />
          <StatTile
            icon="map-marker-distance"
            value={formatDistanceKm(engine.stats.distanceKm)}
            label={t('nav.distance')}
            emphasis
          />
          <StatTile
            icon="timer-outline"
            value={formatClock(engine.stats.elapsedSeconds)}
            label={t('nav.elapsed')}
            emphasis
          />
        </View>
        <View style={styles.progressWrap}>
          <ProgressBar value={engine.stats.progressFraction} />
          <View style={styles.progressMeta}>
            <AppText variant="caption" color={colors.textSecondary}>
              {Math.round(engine.stats.progressFraction * 100)}% {t('nav.complete')}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {t('nav.eta')} {formatDuration(engine.stats.etaMinutes, language)} ·{' '}
              {engine.reachedCount}/{engine.totalCheckpoints}
            </AppText>
          </View>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.topControls}>
        <IconButton name="close" onPress={onExit} />
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.bottomRow}>
          <View style={styles.bottomBtn}>
            <Button
              label={t('scan.button')}
              icon="qrcode-scan"
              onPress={() => setScannerOpen(true)}
            />
          </View>
          <View style={styles.bottomBtn}>
            <Button
              label={t('nav.finish')}
              icon="flag-checkered"
              variant="secondary"
              onPress={onFinish}
              loading={engine.status === 'completing'}
            />
          </View>
        </View>
      </View>

      <QRScannerModal
        visible={scannerOpen}
        onScanned={onScanned}
        onClose={() => setScannerOpen(false)}
      />

      <ScanResultCard
        result={scanResult}
        visible={!!scanResult}
        onClose={() => setScanResult(null)}
      />

      <CheckpointModal
        checkpoint={modal?.checkpoint ?? null}
        visible={!!modal}
        triggered={modal?.triggered}
        onClose={() => setModal(null)}
      />

      <RunSummaryOverlay
        visible={!!summary}
        routeTitle={pickLocalized(route.title)}
        distanceKm={summary?.totalDistanceKm ?? 0}
        movingSeconds={summary?.movingSeconds ?? 0}
        reachedCount={engine.reachedCount}
        totalCheckpoints={engine.totalCheckpoints}
        track={summary?.pathLog ?? []}
        onClose={goToProfile}
        onSave={goToProfile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  hud: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    ...shadow.md,
  },
  hudRow: { flexDirection: 'row', justifyContent: 'space-around' },
  progressWrap: { marginTop: spacing.lg },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  topControls: {
    position: 'absolute',
    right: spacing.lg,
    top: '50%',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadow.lg,
  },
  exitDenied: { position: 'absolute', left: spacing.xl, right: spacing.xl },
  bottomRow: { flexDirection: 'row' },
  bottomBtn: { flex: 1, marginHorizontal: spacing.xs },
});
