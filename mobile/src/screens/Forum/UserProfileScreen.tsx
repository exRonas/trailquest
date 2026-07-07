import React, { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, Card, EmptyState, ErrorState, Loader } from '../../components/ui';
import { Avatar } from '../../components/forum/Avatar';
import { StatTile } from '../../components/StatTile';
import { colors, shadow, spacing } from '../../theme';
import { formatClock, formatDate, formatDistanceKm } from '../../utils/format';
import { usePublicProfile } from '../../api/hooks/useUsers';
import { getApiErrorMessage } from '../../api/client';
import { useT, usePickLocalized } from '../../i18n';
import { ProgressWithRoute } from '../../types/api';
import { ForumScreenProps } from '../../types/navigation';

export function UserProfileScreen({
  route,
  navigation,
}: ForumScreenProps<'UserProfile'>): React.ReactElement {
  const t = useT();
  const { userId, userName } = route.params;
  const { data, isLoading, isError, error, refetch, isRefetching } =
    usePublicProfile(userId);

  useEffect(() => {
    navigation.setOptions({ title: userName });
  }, [navigation, userName]);

  if (isLoading) return <Loader message={t('profile.loading')} />;
  if (isError || !data) {
    return <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />;
  }

  const header = (
    <View>
      <Card style={styles.profileCard}>
        <Avatar name={data.user.name} avatar={data.user.avatar} size={64} />
        <View style={styles.profileText}>
          <AppText variant="heading">{data.user.name}</AppText>
          <AppText variant="caption" color={colors.textMuted} style={styles.since}>
            {t('profile.memberSince', { date: formatDate(data.user.createdAt) })}
          </AppText>
        </View>
      </Card>

      <View style={styles.summary}>
        <StatTile
          icon="trophy-outline"
          value={`${data.stats.completedCount}`}
          label={t('userProfile.completed')}
        />
        <View style={styles.summaryDivider} />
        <StatTile
          icon="map-marker-distance"
          value={formatDistanceKm(data.stats.totalDistanceKm)}
          label={t('userProfile.totalDist')}
        />
        <View style={styles.summaryDivider} />
        <StatTile
          icon="timer-outline"
          value={formatClock(data.stats.movingSeconds)}
          label={t('userProfile.movingTime')}
        />
      </View>

      <AppText variant="subheading" style={styles.historyTitle}>
        {t('userProfile.activities')}
      </AppText>
    </View>
  );

  return (
    <FlatList
      style={styles.fill}
      data={data.activities}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      onRefresh={refetch}
      refreshing={isRefetching}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <ActivityRow
          session={item}
          onPress={() =>
            navigation.navigate('PublicActivityDetail', {
              userId,
              progressId: item.id,
            })
          }
        />
      )}
      ListEmptyComponent={
        <EmptyState
          icon="hiking"
          title={t('userProfile.noActivitiesTitle')}
          message={t('userProfile.noActivities')}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

function ActivityRow({
  session,
  onPress,
}: {
  session: ProgressWithRoute;
  onPress: () => void;
}): React.ReactElement {
  const pickLocalized = usePickLocalized();
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.row} elevated={false}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {pickLocalized(session.route.title)}
        </AppText>
        <View style={styles.rowRegion}>
          <Icon name="map-marker-outline" size={13} color={colors.textMuted} />
          <AppText variant="caption" color={colors.textSecondary} style={styles.rowRegionText}>
            {pickLocalized(session.route.region)}
          </AppText>
        </View>
        <View style={styles.rowStats}>
          <RowStat icon="map-marker-distance" text={formatDistanceKm(session.totalDistanceKm)} />
          <RowStat icon="timer-outline" text={formatClock(session.movingSeconds)} />
          {/* Public profiles only ever list completed sessions (server-filtered). */}
          <RowStat
            icon="calendar-blank-outline"
            text={formatDate(session.completedAt!)}
          />
          <Icon name="chevron-right" size={20} color={colors.textMuted} style={styles.rowChevron} />
        </View>
      </Card>
    </Pressable>
  );
}

function RowStat({ icon, text }: { icon: string; text: string }): React.ReactElement {
  return (
    <View style={styles.rowStat}>
      <Icon name={icon} size={14} color={colors.primary} />
      <AppText variant="label" color={colors.textSecondary} style={styles.rowStatText}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.huge },
  profileCard: { flexDirection: 'row', alignItems: 'center' },
  profileText: { marginLeft: spacing.lg, flex: 1 },
  since: { marginTop: spacing.xs },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
    ...shadow.sm,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: colors.border,
  },
  historyTitle: { marginTop: spacing.xl, marginBottom: spacing.md },
  row: { marginBottom: spacing.md, backgroundColor: colors.surface },
  rowRegion: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  rowRegionText: { marginLeft: 4 },
  rowStats: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  rowStat: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.lg },
  rowStatText: { marginLeft: 4 },
  rowChevron: { marginLeft: 'auto' },
});
