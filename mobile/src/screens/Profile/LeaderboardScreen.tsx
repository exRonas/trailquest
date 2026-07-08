import React, { useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { AppText, EmptyState, Loader } from '../../components/ui';
import { Avatar } from '../../components/forum/Avatar';
import { colors, spacing, useThemeColors } from '../../theme';
import { useLeaderboard } from '../../api/hooks/useProgress';
import { useT, usePickLocalized } from '../../i18n';
import { LeaderboardEntry } from '../../types/api';
import { ProfileScreenProps } from '../../types/navigation';

export function LeaderboardScreen({
  navigation,
}: ProfileScreenProps<'Leaderboard'>): React.ReactElement {
  const t = useT();
  const { data, isLoading, refetch, isRefetching } = useLeaderboard();

  useEffect(() => {
    navigation.setOptions({ title: t('leaderboard.title') });
  }, [navigation, t]);

  if (isLoading && !data) return <Loader message={t('leaderboard.title')} />;

  const top = data?.top ?? [];
  const me = data?.me ?? null;

  if (top.length === 0) {
    return (
      <View style={styles.fill}>
        <EmptyState
          icon="podium"
          title={t('leaderboard.title')}
          message={t('leaderboard.empty')}
        />
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <FlatList
        style={styles.fill}
        data={top}
        keyExtractor={(item) => item.user.id}
        contentContainerStyle={styles.content}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          <AppText variant="callout" color={colors.textSecondary} style={styles.subtitle}>
            {t('leaderboard.subtitle')}
          </AppText>
        }
        renderItem={({ item }) => <Row entry={item} youLabel={t('leaderboard.you')} />}
        ListFooterComponent={
          me ? (
            <View style={styles.meFooter}>
              <AppText variant="overline" color={colors.textMuted} style={styles.meLabel}>
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
          <AppText variant="bodyStrong" color={colors.textSecondary}>
            {entry.rank}
          </AppText>
        )}
      </View>
      <Avatar name={entry.user.name} avatar={entry.user.avatar} size={40} />
      <View style={styles.nameCell}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {entry.isMe ? youLabel : entry.user.name}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
          {pickLocalized(entry.rankName)}
        </AppText>
      </View>
      <View style={styles.xpCell}>
        <AppText variant="bodyStrong" color={theme.primary}>
          {entry.xp}
        </AppText>
        <AppText variant="overline" color={colors.textMuted}>
          XP
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.huge },
  subtitle: { marginBottom: spacing.md },
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
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  meLabel: { marginBottom: spacing.xs },
});
