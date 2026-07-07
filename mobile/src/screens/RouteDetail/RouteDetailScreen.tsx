import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  AppText,
  Button,
  Divider,
  ErrorState,
  IconButton,
  Loader,
} from '../../components/ui';
import { CategoryBadge, DifficultyBadge } from '../../components/RouteBadges';
import { StatTile } from '../../components/StatTile';
import { TipCard } from '../../components/TipCard';
import { RoutePreviewMap } from '../../components/map/RoutePreviewMap';
import { CheckpointModal } from '../../components/CheckpointModal';
import { OfflineMapCard } from '../../components/OfflineMapCard';
import { hasMapboxToken } from '../../services/mapbox';
import { colors, shadow, spacing } from '../../theme';
import { checkpointIcon, categoryIcon } from '../../theme/icons';
import {
  formatDistanceKm,
  formatDuration,
  labelForCheckpointType,
} from '../../utils/format';
import { useRouteDetail } from '../../api/hooks/useRoutes';
import { useStartRoute } from '../../api/hooks/useProgress';
import { getApiErrorMessage } from '../../api/client';
import { useT, usePickLocalized, useLocaleStore } from '../../i18n';
import { Checkpoint } from '../../types/api';
import { ExploreScreenProps } from '../../types/navigation';

export function RouteDetailScreen({
  route,
  navigation,
}: ExploreScreenProps<'RouteDetail'>): React.ReactElement {
  const { routeId } = route.params;
  const t = useT();
  const pickLocalized = usePickLocalized();
  const language = useLocaleStore((s) => s.language);
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, error, refetch } = useRouteDetail(routeId);
  const startMutation = useStartRoute();

  const [selected, setSelected] = useState<Checkpoint | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const { warnings, advice } = useMemo(() => {
    const tips = data?.tips ?? [];
    return {
      warnings: tips.filter((t) => t.type === 'WARNING'),
      advice: tips.filter((t) => t.type === 'ADVICE'),
    };
  }, [data]);

  // Every coordinate touched by the route (line + checkpoints) — the offline
  // tile pack needs to cover all of it, not just the path.
  const offlineCoords = useMemo<[number, number][]>(() => {
    if (!data) return [];
    const line =
      data.routeGeometry && data.routeGeometry.length > 1
        ? data.routeGeometry.map((p) => [p.lng, p.lat] as [number, number])
        : data.pathPoints.map((p) => [p.lng, p.lat] as [number, number]);
    const checkpointCoords = data.checkpoints.map(
      (c) => [c.lng, c.lat] as [number, number],
    );
    return [...line, ...checkpointCoords];
  }, [data]);

  const onStart = async () => {
    try {
      const progress = await startMutation.mutateAsync(routeId);
      navigation.navigate('ActiveNavigation', {
        routeId,
        progressId: progress.id,
        reachedOrderIndices: progress.reachedOrderIndices ?? [],
      });
    } catch (err) {
      Alert.alert(t('route.startFailed'), getApiErrorMessage(err));
    }
  };

  if (isLoading) {
    return <Loader message={t('route.loading')} />;
  }
  if (isError || !data) {
    return (
      <View style={styles.fill}>
        <BackButton top={insets.top} onPress={() => navigation.goBack()} />
        <ErrorState
          message={getApiErrorMessage(error, 'Could not load this route.')}
          onRetry={refetch}
        />
      </View>
    );
  }

  const showImage = !!data.coverImageUrl && !imageFailed;

  return (
    <View style={styles.fill}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          {showImage ? (
            <Image
              source={{ uri: data.coverImageUrl! }}
              style={styles.heroImage}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Icon
                name={categoryIcon[data.category]}
                size={56}
                color={colors.primary}
              />
            </View>
          )}
          <View style={styles.heroBadges}>
            <CategoryBadge category={data.category} />
            <View style={{ width: spacing.xs }} />
            <DifficultyBadge difficulty={data.difficulty} />
          </View>
        </View>

        <BackButton top={insets.top} onPress={() => navigation.goBack()} />

        {/* Body */}
        <View style={styles.body}>
          <AppText variant="title">{pickLocalized(data.title)}</AppText>
          <View style={styles.regionRow}>
            <Icon name="map-marker-outline" size={16} color={colors.textMuted} />
            <AppText
              variant="callout"
              color={colors.textSecondary}
              style={styles.region}
            >
              {pickLocalized(data.region)}
            </AppText>
          </View>

          <View style={styles.statsCard}>
            <StatTile
              icon="map-marker-distance"
              value={formatDistanceKm(data.distanceKm)}
              label={t('route.distance')}
            />
            <View style={styles.statDivider} />
            <StatTile
              icon="clock-outline"
              value={formatDuration(data.estimatedMinutes, language)}
              label={t('route.estTime')}
            />
            <View style={styles.statDivider} />
            <StatTile
              icon="flag-variant-outline"
              value={`${data.checkpoints.length}`}
              label={t('route.checkpoints')}
            />
          </View>

          <AppText variant="body" color={colors.textSecondary} style={styles.desc}>
            {pickLocalized(data.description)}
          </AppText>

          {/* Map preview */}
          <SectionTitle icon="map-outline" title={t('route.map')} />
          <RoutePreviewMap
            pathPoints={data.pathPoints}
            geometry={data.routeGeometry}
            checkpoints={data.checkpoints}
            height={220}
            onCheckpointPress={(id) =>
              setSelected(data.checkpoints.find((c) => c.id === id) ?? null)
            }
          />
          {hasMapboxToken ? (
            <OfflineMapCard routeId={data.id} coords={offlineCoords} />
          ) : null}

          {/* Tips & warnings */}
          {warnings.length + advice.length > 0 ? (
            <>
              <SectionTitle icon="information-outline" title={t('route.tipsWarnings')} />
              {warnings.map((t) => (
                <TipCard key={t.id} tip={t} />
              ))}
              {advice.map((t) => (
                <TipCard key={t.id} tip={t} />
              ))}
            </>
          ) : null}

          {/* Checkpoints */}
          <SectionTitle
            icon="flag-checkered"
            title={t('route.checkpointsCount', { count: data.checkpoints.length })}
          />
          {data.checkpoints.map((cp) => (
            <CheckpointRow
              key={cp.id}
              checkpoint={cp}
              onPress={() => setSelected(cp)}
            />
          ))}

          {/* Discussion */}
          <Divider />
          <Pressable
            style={styles.discussionRow}
            onPress={() =>
              navigation.navigate('ForumTab', {
                screen: 'RoutePosts',
                params: { routeId: data.id, routeTitle: pickLocalized(data.title) },
              })
            }
          >
            <Icon name="forum-outline" size={22} color={colors.primary} />
            <AppText variant="bodyStrong" style={styles.discussionText}>
              {t('route.discussion')}
            </AppText>
            <AppText variant="callout" color={colors.textMuted}>
              {data._count.posts === 1
                ? t('route.postsCountOne')
                : t('route.postsCount', { count: data._count.posts })}
            </AppText>
            <Icon name="chevron-right" size={22} color={colors.textMuted} />
          </Pressable>
        </View>
      </ScrollView>

      {/* Sticky start bar */}
      <View style={[styles.startBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          label={t('route.start')}
          icon="navigation-variant"
          onPress={onStart}
          loading={startMutation.isPending}
        />
      </View>

      <CheckpointModal
        checkpoint={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

function BackButton({
  top,
  onPress,
}: {
  top: number;
  onPress: () => void;
}): React.ReactElement {
  return (
    <View style={[styles.backWrap, { top: top + spacing.sm }]}>
      <IconButton name="arrow-left" onPress={onPress} />
    </View>
  );
}

function SectionTitle({
  icon,
  title,
}: {
  icon: string;
  title: string;
}): React.ReactElement {
  return (
    <View style={styles.sectionTitle}>
      <Icon name={icon} size={18} color={colors.primary} />
      <AppText variant="subheading" style={styles.sectionTitleText}>
        {title}
      </AppText>
    </View>
  );
}

function CheckpointRow({
  checkpoint,
  onPress,
}: {
  checkpoint: Checkpoint;
  onPress: () => void;
}): React.ReactElement {
  const pickLocalized = usePickLocalized();
  const c = colors.checkpoint[checkpoint.type];
  return (
    <Pressable style={styles.cpRow} onPress={onPress}>
      <View style={[styles.cpIcon, { backgroundColor: c.soft }]}>
        <Icon name={checkpointIcon[checkpoint.type]} size={20} color={c.main} />
      </View>
      <View style={styles.cpBody}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {pickLocalized(checkpoint.name)}
        </AppText>
        <AppText variant="caption" color={c.main}>
          {labelForCheckpointType(checkpoint.type)}
        </AppText>
      </View>
      <Icon name="chevron-right" size={22} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  hero: { height: 260, backgroundColor: colors.primarySoft },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroBadges: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    flexDirection: 'row',
  },
  backWrap: { position: 'absolute', left: spacing.lg },
  body: {
    marginTop: -20,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
  },
  regionRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  region: { marginLeft: 4 },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
    justifyContent: 'space-around',
    alignItems: 'center',
    ...shadow.sm,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: colors.border,
  },
  desc: { marginTop: spacing.lg },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionTitleText: { marginLeft: spacing.sm },
  cpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cpIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cpBody: { flex: 1 },
  discussionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  discussionText: { flex: 1, marginLeft: spacing.md },
  startBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadow.lg,
  },
});
