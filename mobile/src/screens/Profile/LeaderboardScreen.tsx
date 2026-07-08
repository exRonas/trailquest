import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { AppText, Chip, EmptyState, Loader } from '../../components/ui';
import { Avatar } from '../../components/forum/Avatar';
import { spacing, useThemeColors } from '../../theme';
import { useLeaderboard } from '../../api/hooks/useProgress';
import { LeaderboardPeriod } from '../../api/progress.api';
import { useT, usePickLocalized } from '../../i18n';
import { LeaderboardEntry } from '../../types/api';
import { ProfileScreenProps } from '../../types/navigation';

export function LeaderboardScreen({
  navigation,
}: ProfileScreenProps<'Leaderboard'>): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const { data, isLoading, refetch, isRefetching } = useLeaderboard(period);

  useEffect(() => {
    navigation.setOptions({ title: t('leaderboard.title') });
  }, [navigation, t]);

  const top = data?.top ?? [];
  const me = data?.me ?? null;

  const periodTabs = (
    <View style={styles.periodRow}>
      <Chip
        label={t('leaderboard.periodAll')}
        icon="trophy-outline"
        selected={period === 'all'}
        onPress={() => setPeriod('all')}
      />
      <Chip
        label={t('leaderboard.periodMonth')}
        icon="calendar-month-outline"
        selected={period === 'month'}
        onPress={() => setPeriod('month')}
      />
    </View>
  );

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <FlatList
        style={styles.fill}
        data={top}
        keyExtractor={(item) => item.user.id}
        contentContainerStyle={styles.content}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          <View>
            {periodTabs}
            {isLoading && !data ? (
              <Loader message={t('leaderboard.title')} />
            ) : null}
          </View>
        }
        renderItem={({ item }) => <Row entry={item} youLabel={t('leaderboard.you')} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="podium"
              title={t('leaderboard.title')}
              message={t('leaderboard.empty')}
            />
          ) : null
        }
        ListFooterComponent={
          me ? (
            <View style={[styles.meFooter, { borderTopColor: theme.border }]}>
              <AppText variant="overline" color={theme.textMuted} style={styles.meLabel}>
                {t('leaderboard.yourPosition')}
              </AppText>
              <Row entry={me} youLabel={t('leaderboard.you')} />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function Row({
  entry,
  youLabel,
}: {
  entry: LeaderboardEntry;
  youLabel: string;
}): React.ReactElement {
  const theme = useThemeColors();
  const pickLocalized = usePickLocalized();
  const medal =
    entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;

  return (
    <View
      style={[
        styles.row,
        entry.isMe ? { backgroundColor: theme.primarySoft } : null,
      ]}
    >
      <View style={styles.rankCell}>
        {medal ? (
          <AppText variant="subheading">{medal}</AppText>
        ) : (
          <AppText variant="bodyStrong" color={theme.textSecondary}>
            {entry.rank}
          </AppText>
        )}
      </View>
      <Avatar name={entry.user.name} avatar={entry.user.avatar} size={40} />
      <View style={styles.nameCell}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {entry.isMe ? youLabel : entry.user.name}
        </AppText>
        <AppText variant="caption" color={theme.textSecondary} numberOfLines={1}>
          {pickLocalized(entry.rankName)}
        </AppText>
      </View>
      <View style={styles.xpCell}>
        <AppText variant="bodyStrong" color={theme.primary}>
          {entry.xp}
        </AppText>
        <AppText variant="overline" color={theme.textMuted}>
          XP
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.huge },
  periodRow: { flexDirection: 'row', marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  rankCell: { width: 34, alignItems: 'center' },
  nameCell: { flex: 1, marginLeft: spacing.md },
  xpCell: { alignItems: 'flex-end' },
  meFooter: {
    marginTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
  },
  meLabel: { marginBottom: spacing.xs },
});
