import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, Card } from './ui';
import { CategoryBadge, DifficultyBadge } from './RouteBadges';
import { StarRating } from './StarRating';
import { colors, spacing, useThemeColors } from '../theme';
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
  const pickLocalized = usePickLocalized();
  const language = useLocaleStore((s) => s.language);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!route.coverImageUrl && !imageFailed;

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

        <View style={styles.statsRow}>
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
});
