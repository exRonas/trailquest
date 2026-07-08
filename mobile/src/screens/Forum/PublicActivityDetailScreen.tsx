import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, Card, Loader } from '../../components/ui';
import { StatTile } from '../../components/StatTile';
import { TrackMap } from '../../components/map/TrackMap';
import { colors, shadow, spacing } from '../../theme';
import { formatClock, formatDateTime, formatDistanceKm } from '../../utils/format';
import { usePublicProfile } from '../../api/hooks/useUsers';
import { useT, usePickLocalized } from '../../i18n';
import { ForumScreenProps } from '../../types/navigation';

export function PublicActivityDetailScreen({
  route,
  navigation,
}: ForumScreenProps<'PublicActivityDetail'>): React.ReactElement {
  const t = useT();
  const pickLocalized = usePickLocalized();
  const { userId, progressId } = route.params;
  const { data } = usePublicProfile(userId);
  const session = data?.activities.find((a) => a.id === progressId);

  useEffect(() => {
    navigation.setOptions({ title: t('activity.title') });
  }, [navigation, t]);

  if (!session) return <Loader message={t('profile.loading')} />;

  const avgSpeed =
    session.movingSeconds > 0
      ? session.totalDistanceKm / (session.movingSeconds / 3600)
      : 0;

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="title">{pickLocalized(session.route.title)}</AppText>
      <View style={styles.regionRow}>
        <Icon name="map-marker-outline" size={14} color={colors.textMuted} />
        <AppText variant="caption" color={colors.textSecondary} style={styles.region}>
          {pickLocalized(session.route.region)}
        </AppText>
      </View>

      <AppText variant="subheading" style={styles.sectionTitle}>
        {t('activity.yourTrack')}
      </AppText>
      <TrackMap track={session.pathLog ?? []} height={240} interactive />

      <View style={styles.statsCard}>
        <StatTile
          icon="map-marker-distance"
          value={formatDistanceKm(session.totalDistanceKm)}
          label={t('summary.distance')}
        />
        <View style={styles.divider} />
        <StatTile
          icon="timer-outline"
          value={formatClock(session.movingSeconds)}
          label={t('summary.time')}
        />
        <View style={styles.divider} />
        <StatTile
          icon="speedometer"
          value={`${avgSpeed.toFixed(1)}`}
          label={t('summary.avgSpeed')}
        />
      </View>

      <Card style={styles.metaCard} elevated={false}>
        <View style={styles.metaRow}>
          <AppText variant="callout" color={colors.textSecondary}>
            {t('activity.started')}
          </AppText>
          <AppText variant="callout">{formatDateTime(session.startedAt)}</AppText>
        </View>
        {session.completedAt ? (
          <View style={styles.metaRow}>
            <AppText variant="callout" color={colors.textSecondary}>
              {t('activity.finished')}
            </AppText>
            <AppText variant="callout">{formatDateTime(session.completedAt)}</AppText>
          </View>
        ) : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.huge },
  regionRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  region: { marginLeft: 4 },
  sectionTitle: { marginTop: spacing.xl, marginBottom: spacing.md },
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
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: colors.border,
  },
  metaCard: { marginTop: spacing.lg, backgroundColor: colors.surface },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
});
