import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { AppText, Card } from './ui';
import { CategoryBadge, DifficultyBadge } from './RouteBadges';
import { StarRating } from './StarRating';
import { colors, spacing, useDesignVersion, useThemeColors } from '../theme';
import { TopoPattern } from './decor';
import { categoryIcon } from '../theme/icons';
import { formatDistanceKm, formatDuration } from '../utils/format';
import { useT, usePickLocalized, useLocaleStore } from '../i18n';
import { RouteSummary } from '../types/api';

interface RouteCardProps {
  route: RouteSummary;
  onPress: () => void;
}

export function RouteCard({ route, onPress }: RouteCardProps): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const design = useDesignVersion();
  const pickLocalized = usePickLocalized();
  const language = useLocaleStore((s) => s.language);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!route.coverImageUrl && !imageFailed;

  if (design === 'v3') {
    return (
      <AtlasRouteCard
        route={route}
        onPress={onPress}
        showImage={showImage}
        onImageError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <Card onPress={onPress} padded={false} style={styles.card}>
      <View style={[styles.cover, { backgroundColor: theme.primarySoft }]}>
        {showImage ? (
          <Image
            source={{ uri: route.coverImageUrl! }}
            style={styles.image}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={styles.placeholder}>
            <Icon
              name={categoryIcon[route.category]}
              size={40}
              color={theme.primary}
            />
          </View>
        )}
        <View style={styles.badgeRow}>
          <CategoryBadge category={route.category} />
          <View style={styles.badgeGap} />
          <DifficultyBadge difficulty={route.difficulty} />
        </View>
      </View>

      <View style={styles.content}>
        <AppText variant="subheading" numberOfLines={1}>
          {pickLocalized(route.title)}
        </AppText>
        <View style={styles.regionRow}>
          <Icon name="map-marker-outline" size={14} color={colors.textMuted} />
          <AppText
            variant="caption"
            color={colors.textSecondary}
            numberOfLines={1}
            style={styles.region}
          >
            {pickLocalized(route.region)}
          </AppText>
        </View>

        {route.rating.count > 0 ? (
          <View style={styles.ratingRow}>
            <StarRating value={route.rating.average} size={14} />
            <AppText
              variant="label"
              color={colors.textSecondary}
              style={styles.ratingText}
            >
              {route.rating.average.toFixed(1)} ({route.rating.count})
            </AppText>
          </View>
        ) : null}

        <View style={[styles.statsRow, { borderTopColor: theme.border }]}>
          <Stat icon="map-marker-distance" text={formatDistanceKm(route.distanceKm)} />
          <Stat
            icon="clock-outline"
            text={formatDuration(route.estimatedMinutes, language)}
          />
          <Stat
            icon="flag-variant-outline"
            text={
              route._count.checkpoints === 1
                ? t('route.stopsOne')
                : t('route.stops', { count: route._count.checkpoints })
            }
          />
        </View>
      </View>
    </Card>
  );
}

/** Atlas ('v3') layout — full-bleed image poster: serif title and meta sit ON
 *  the photo over a bottom scrim, badges float top-left, stats run as a strip
 *  along the bottom. Imageless routes get a topo-contour placeholder. */
function AtlasRouteCard({
  route,
  onPress,
  showImage,
  onImageError,
}: RouteCardProps & {
  showImage: boolean;
  onImageError: () => void;
}): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const pickLocalized = usePickLocalized();
  const language = useLocaleStore((s) => s.language);

  return (
    <Card onPress={onPress} padded={false} style={styles.atlasCard}>
      <View style={[styles.atlasCover, { backgroundColor: theme.primarySoft }]}>
        {showImage ? (
          <>
            <Image
              source={{ uri: route.coverImageUrl! }}
              style={styles.image}
              onError={onImageError}
            />
            {/* Bottom scrim so the on-photo text stays readable */}
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
              <Defs>
                <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0.35" stopColor="#000" stopOpacity="0" />
                  <Stop offset="1" stopColor="#1E1A13" stopOpacity="0.82" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#scrim)" />
            </Svg>
          </>
        ) : (
          <>
            <TopoPattern color={theme.primary} opacity={0.28} />
            <View style={styles.placeholder}>
              <Icon
                name={categoryIcon[route.category]}
                size={44}
                color={theme.primary}
              />
            </View>
          </>
        )}

        <View style={styles.badgeRow}>
          <CategoryBadge category={route.category} />
          <View style={styles.badgeGap} />
          <DifficultyBadge difficulty={route.difficulty} />
        </View>

        <View style={styles.atlasOverlay}>
          <AppText
            variant="heading"
            color={showImage ? '#FFFDF6' : theme.text}
            numberOfLines={2}
          >
            {pickLocalized(route.title)}
          </AppText>
          <View style={styles.regionRow}>
            <Icon
              name="map-marker-outline"
              size={14}
              color={showImage ? 'rgba(255,253,246,0.85)' : theme.textMuted}
            />
            <AppText
              variant="caption"
              color={showImage ? 'rgba(255,253,246,0.85)' : theme.textSecondary}
              numberOfLines={1}
              style={styles.region}
            >
              {pickLocalized(route.region)}
            </AppText>
            {route.rating.count > 0 ? (
              <>
                <Icon name="star" size={13} color={theme.warning} style={styles.atlasStar} />
                <AppText
                  variant="caption"
                  color={showImage ? 'rgba(255,253,246,0.95)' : theme.textSecondary}
                >
                  {route.rating.average.toFixed(1)} ({route.rating.count})
                </AppText>
              </>
            ) : null}
          </View>
        </View>
      </View>

      <View style={[styles.atlasStats, { backgroundColor: theme.surfaceAlt }]}>
        <AtlasStat icon="map-marker-distance" text={formatDistanceKm(route.distanceKm)} />
        <View style={[styles.atlasStatDivider, { backgroundColor: theme.border }]} />
        <AtlasStat
          icon="clock-outline"
          text={formatDuration(route.estimatedMinutes, language)}
        />
        <View style={[styles.atlasStatDivider, { backgroundColor: theme.border }]} />
        <AtlasStat
          icon="flag-variant-outline"
          text={
            route._count.checkpoints === 1
              ? t('route.stopsOne')
              : t('route.stops', { count: route._count.checkpoints })
          }
        />
      </View>
    </Card>
  );
}

function AtlasStat({ icon, text }: { icon: string; text: string }): React.ReactElement {
  const theme = useThemeColors();
  return (
    <View style={styles.atlasStat}>
      <Icon name={icon} size={15} color={theme.accent} />
      <AppText variant="label" color={theme.textSecondary} style={styles.statText}>
        {text}
      </AppText>
    </View>
  );
}

function Stat({ icon, text }: { icon: string; text: string }): React.ReactElement {
  const theme = useThemeColors();
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={15} color={theme.primary} />
      <AppText variant="label" color={colors.textSecondary} style={styles.statText}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  cover: { height: 140 },
  image: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
  },
  badgeGap: { width: spacing.xs },
  content: { padding: spacing.lg },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  region: { marginLeft: 4, flex: 1 },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ratingText: { marginLeft: spacing.xs },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  stat: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.lg },
  statText: { marginLeft: 4 },

  // Atlas (v3)
  atlasCard: { marginBottom: spacing.lg, borderRadius: 20 },
  atlasCover: { height: 190, overflow: 'hidden' },
  atlasOverlay: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
  },
  atlasStar: { marginLeft: spacing.sm, marginRight: 3 },
  atlasStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  atlasStat: { flexDirection: 'row', alignItems: 'center' },
  atlasStatDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
});
