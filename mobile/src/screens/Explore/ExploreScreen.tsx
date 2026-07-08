import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Mapbox from '@rnmapbox/maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { AppText, Banner, Button, EmptyState, ErrorState, IconButton, Loader } from '../../components/ui';
import { RouteCard } from '../../components/RouteCard';
import { FilterBar } from '../../components/explore/FilterBar';
import { MapPlaceholder } from '../../components/map/MapPlaceholder';
import { LocationPermissionBanner } from '../../components/LocationPermissionBanner';
import { colors, shadow, spacing, useThemeColors } from '../../theme';
import { hasMapboxToken, mapStyleUrl, DEFAULT_CAMERA } from '../../services/mapbox';
import { getCurrentPosition } from '../../services/geolocation';
import { haversineMeters } from '../../utils/geo';
import { useRoutes } from '../../api/hooks/useRoutes';
import { getApiErrorMessage } from '../../api/client';
import { useT, useLocaleStore, pickLocalized, Language } from '../../i18n';
import { RouteFilters, RouteSummary } from '../../types/api';
import { ExploreScreenProps } from '../../types/navigation';

type Coord = [number, number];

/** Routes whose start point is within this many km are considered "near you". */
const NEARBY_KM = 50;
/** How many routes show inline before the user taps "Show more". */
const SHOWN_LIMIT = 4;

function toFeatureCollection(routes: RouteSummary[], lang: Language) {
  return {
    type: 'FeatureCollection' as const,
    features: routes
      .filter((r) => r.startLat != null && r.startLng != null)
      .map((r) => ({
        type: 'Feature' as const,
        id: r.id,
        properties: { routeId: r.id, title: pickLocalized(r.title, lang) },
        geometry: {
          type: 'Point' as const,
          coordinates: [r.startLng as number, r.startLat as number] as Coord,
        },
      })),
  };
}

export function ExploreScreen({
  navigation,
}: ExploreScreenProps<'Explore'>): React.ReactElement {
  const insets = useSafeAreaInsets();
  const t = useT();
  const theme = useThemeColors();
  const language = useLocaleStore((s) => s.language);
  const [filters, setFilters] = useState<RouteFilters>({});
  const { data: routes, isLoading, isError, error, refetch, isFetching } =
    useRoutes(filters);

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [expanded, setExpanded] = useState(false);

  const cameraRef = useRef<Mapbox.Camera>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['22%', '55%', '92%'], []);
  const fittedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const onMapReady = useCallback(() => setMapReady(true), []);

  // Try to get the user's location once so we can surface nearby routes first.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pos = await getCurrentPosition();
      if (!cancelled && pos) setUserPos({ lat: pos.lat, lng: pos.lng });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // The list/map show routes near the user when we have a location; otherwise
  // everything (with a hint to enable location). Server-side category/difficulty
  // filters still apply on top.
  const displayed = useMemo(() => {
    const all = routes ?? [];
    if (!userPos) return all;
    return all.filter(
      (r) =>
        r.startLat != null &&
        r.startLng != null &&
        haversineMeters(userPos, { lat: r.startLat, lng: r.startLng }) / 1000 <=
          NEARBY_KM,
    );
  }, [routes, userPos]);

  const visible = useMemo(
    () => (expanded ? displayed : displayed.slice(0, SHOWN_LIMIT)),
    [displayed, expanded],
  );

  const featureCollection = useMemo(
    () => toFeatureCollection(displayed, language),
    [displayed, language],
  );

  // Fit the camera to the visible markers once, after the map has actually
  // finished loading (a bare requestAnimationFrame could fire before the
  // native camera exists and silently no-op — see RoutePreviewMap).
  useEffect(() => {
    if (fittedRef.current || !hasMapboxToken || !mapReady) return;
    const coords = featureCollection.features.map((f) => f.geometry.coordinates);
    if (coords.length === 0) return;
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    const ne: Coord = [Math.max(...lngs), Math.max(...lats)];
    const sw: Coord = [Math.min(...lngs), Math.min(...lats)];
    fittedRef.current = true;
    cameraRef.current?.fitBounds(ne, sw, [120, 60, 320, 60], 800);
  }, [featureCollection, mapReady]);

  const openRoute = useCallback(
    (routeId: string) => navigation.navigate('RouteDetail', { routeId }),
    [navigation],
  );

  const openCountries = useCallback(
    () => navigation.navigate('Countries'),
    [navigation],
  );

  const onSourcePress = useCallback(
    (e: { features: GeoJSON.Feature[] }) => {
      const feature = e.features[0];
      if (!feature) return;
      const props = feature.properties ?? {};
      if (props.cluster) {
        const geom = feature.geometry as { coordinates?: number[] } | null;
        const coord = geom?.coordinates;
        if (coord && coord.length >= 2) {
          cameraRef.current?.setCamera({
            centerCoordinate: [coord[0], coord[1]],
            zoomLevel: 9,
            animationDuration: 600,
          });
        }
        return;
      }
      if (typeof props.routeId === 'string') openRoute(props.routeId);
    },
    [openRoute],
  );

  // Collapse back to the short list whenever the filters change.
  useEffect(() => {
    setExpanded(false);
  }, [filters]);

  const onLocationGranted = useCallback(async () => {
    if (userPos) return;
    const pos = await getCurrentPosition();
    if (pos) setUserPos({ lat: pos.lat, lng: pos.lng });
  }, [userPos]);

  const locateMe = useCallback(async () => {
    const pos = await getCurrentPosition();
    if (pos) {
      setUserPos({ lat: pos.lat, lng: pos.lng });
      cameraRef.current?.setCamera({
        centerCoordinate: [pos.lng, pos.lat],
        zoomLevel: 12,
        animationDuration: 700,
      });
    }
  }, []);

  const renderEmpty = () => {
    if (isLoading) {
      return <Loader message={t('explore.finding')} />;
    }
    if (isError) {
      return (
        <ErrorState
          message={getApiErrorMessage(error, t('explore.noRoutesTitle'))}
          onRetry={refetch}
        />
      );
    }
    // We have data but nothing to show.
    if (userPos && (routes?.length ?? 0) > 0) {
      // Nearby filter emptied an otherwise-non-empty list.
      return (
        <EmptyState
          icon="map-marker-radius-outline"
          title={t('explore.noneNearbyTitle')}
          message={t('explore.noneNearbyMessage', { km: NEARBY_KM })}
          actionLabel={t('explore.browseByCountry')}
          onAction={openCountries}
        />
      );
    }
    return (
      <EmptyState
        icon="map-search-outline"
        title={t('explore.noRoutesTitle')}
        message={t('explore.noRoutesMessage')}
        actionLabel={
          filters.category || filters.difficulty
            ? t('explore.clearFilters')
            : t('explore.browseByCountry')
        }
        onAction={
          filters.category || filters.difficulty
            ? () => setFilters({})
            : openCountries
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      {hasMapboxToken ? (
        <Mapbox.MapView
          style={styles.map}
          styleURL={mapStyleUrl}
          scaleBarEnabled={false}
          logoPosition={{ bottom: 8, left: 8 }}
          attributionPosition={{ bottom: 8, right: 8 }}
          onDidFinishLoadingMap={onMapReady}
        >
          <Mapbox.Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: DEFAULT_CAMERA.centerCoordinate,
              zoomLevel: DEFAULT_CAMERA.zoomLevel,
            }}
          />
          <Mapbox.UserLocation visible androidRenderMode="normal" />

          <Mapbox.ShapeSource
            id="routes"
            shape={featureCollection}
            cluster
            clusterRadius={60}
            clusterMaxZoomLevel={12}
            onPress={onSourcePress}
          >
            <Mapbox.CircleLayer
              id="clusters"
              filter={['has', 'point_count']}
              style={{
                circleColor: theme.primary,
                circleRadius: ['step', ['get', 'point_count'], 18, 5, 24, 15, 30],
                circleStrokeWidth: 3,
                circleStrokeColor: colors.surface,
                circleOpacity: 0.95,
              }}
            />
            <Mapbox.SymbolLayer
              id="cluster-count"
              filter={['has', 'point_count']}
              style={{
                textField: ['get', 'point_count_abbreviated'],
                textSize: 13,
                textColor: colors.textInverse,
                textFont: ['Open Sans Bold', 'Arial Unicode MS Bold'],
              }}
            />
            <Mapbox.CircleLayer
              id="unclustered"
              filter={['!', ['has', 'point_count']]}
              style={{
                circleColor: theme.primary,
                circleRadius: 9,
                circleStrokeWidth: 3,
                circleStrokeColor: colors.surface,
              }}
            />
          </Mapbox.ShapeSource>
        </Mapbox.MapView>
      ) : (
        <MapPlaceholder />
      )}

      {/* Floating header */}
      <View style={[styles.header, { top: insets.top + spacing.sm }]}>
        <View style={styles.titlePill}>
          <AppText variant="overline" color={theme.primary}>
            {t('explore.brand')}
          </AppText>
          <AppText variant="heading">{t('explore.title')}</AppText>
        </View>
        {hasMapboxToken ? (
          <IconButton name="crosshairs-gps" onPress={locateMe} color={theme.primary} />
        ) : null}
      </View>

      <LocationPermissionBanner onGranted={onLocationGranted} />

      {/* Routes bottom sheet */}
      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={snapPoints}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handle}
      >
        <BottomSheetFlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.sheetContent}
          ListHeaderComponent={
            <View style={styles.sheetHeader}>
              <AppText variant="subheading">
                {userPos ? t('explore.nearYou') : t('explore.allRoutes')}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {isFetching && !isLoading
                  ? t('common.updating')
                  : t('common.routesCount', { count: displayed.length })}
              </AppText>

              <View style={styles.filterWrap}>
                <FilterBar filters={filters} onChange={setFilters} />
              </View>

              <Pressable
                style={[styles.browseRow, { backgroundColor: theme.primarySoft }]}
                onPress={openCountries}
              >
                <Icon name="earth" size={20} color={theme.primary} />
                <AppText
                  variant="bodyStrong"
                  color={theme.primary}
                  style={styles.browseText}
                >
                  {t('explore.browseByCountry')}
                </AppText>
                <Icon name="chevron-right" size={22} color={colors.textMuted} />
              </Pressable>

              {!hasMapboxToken ? (
                <Banner
                  tone="info"
                  message="Add a Mapbox token to enable the map view."
                  style={styles.sheetBanner}
                />
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <RouteCard route={item} onPress={() => openRoute(item.id)} />
          )}
          ListEmptyComponent={<View style={styles.empty}>{renderEmpty()}</View>}
          ListFooterComponent={
            !expanded && displayed.length > SHOWN_LIMIT ? (
              <Button
                label={t('explore.showMore')}
                variant="secondary"
                onPress={() => setExpanded(true)}
                style={styles.showMore}
              />
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  header: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titlePill: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    ...shadow.sm,
  },
  sheetBg: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: { backgroundColor: colors.border, width: 44 },
  sheetContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.huge },
  sheetHeader: { paddingTop: spacing.xs, paddingBottom: spacing.sm },
  filterWrap: { marginTop: spacing.md },
  browseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    marginTop: spacing.xs,
  },
  browseText: { flex: 1, marginLeft: spacing.sm },
  sheetBanner: { marginTop: spacing.sm },
  showMore: { marginTop: spacing.sm },
  empty: { height: 320 },
});
