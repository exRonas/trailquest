import React, { useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  AppText,
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Loader,
  ProgressBar,
} from '../../components/ui';
import { Avatar } from '../../components/forum/Avatar';
import { StatTile } from '../../components/StatTile';
import { colors, shadow, spacing } from '../../theme';
import {
  formatClock,
  formatDate,
  formatDistanceKm,
} from '../../utils/format';
import { useAuthStore } from '../../store/authStore';
import { useMyLevels, useMyProgress } from '../../api/hooks/useProgress';
import { getApiErrorMessage } from '../../api/client';
import { LANGUAGES, useLocaleStore, useT, usePickLocalized } from '../../i18n';
import { CountryLevel, ProgressWithRoute } from '../../types/api';
import { ProfileScreenProps } from '../../types/navigation';

export function ProfileScreen({
  navigation,
}: ProfileScreenProps<'Profile'>): React.ReactElement {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const language = useLocaleStore((s) => s.language);
  const setLanguage = useLocaleStore((s) => s.setLanguage);
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useMyProgress();

  const summary = useMemo(() => {
    const sessions = data ?? [];
    const completed = sessions.filter((s) => s.completedAt);
    const totalKm = sessions.reduce((acc, s) => acc + s.totalDistanceKm, 0);
    const totalSec = sessions.reduce((acc, s) => acc + s.movingSeconds, 0);
    return { completedCount: completed.length, totalKm, totalSec };
  }, [data]);

  const onLogout = () => {
    Alert.alert(t('profile.signOut'), t('profile.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.signOut'), style: 'destructive', onPress: () => void logout() },
    ]);
  };

  const header = (
    <View>
      <Card style={styles.profileCard}>
        <Avatar name={user?.name ?? 'You'} size={64} />
        <View style={styles.profileText}>
          <AppText variant="heading">{user?.name ?? 'Hiker'}</AppText>
          <AppText variant="callout" color={colors.textSecondary}>
            {user?.email}
          </AppText>
          {user?.createdAt ? (
            <AppText variant="caption" color={colors.textMuted} style={styles.since}>
              {t('profile.memberSince', { date: formatDate(user.createdAt) })}
            </AppText>
          ) : null}
        </View>
      </Card>

      <View style={styles.summary}>
        <StatTile
          icon="trophy-outline"
          value={`${summary.completedCount}`}
          label={t('profile.completed')}
        />
        <View style={styles.summaryDivider} />
        <StatTile
          icon="map-marker-distance"
          value={formatDistanceKm(summary.totalKm)}
          label={t('profile.totalDist')}
        />
        <View style={styles.summaryDivider} />
        <StatTile
          icon="timer-outline"
          value={formatClock(summary.totalSec)}
          label={t('profile.movingTime')}
        />
      </View>

      {/* Ranks by country */}
      <RanksSection />

      {/* Language selector */}
      <AppText variant="overline" color={colors.textMuted} style={styles.langTitle}>
        {t('profile.language')}
      </AppText>
      <View style={styles.langRow}>
        {LANGUAGES.map((l) => (
          <Chip
            key={l.code}
            label={l.label}
            icon="translate"
            selected={language === l.code}
            onPress={() => setLanguage(l.code)}
          />
        ))}
      </View>

      <AppText variant="subheading" style={styles.historyTitle}>
        {t('profile.yourRoutes')}
      </AppText>
    </View>
  );

  if (isLoading) return <Loader message={t('profile.loading')} />;
  if (isError) {
    return (
      <View style={styles.fill}>
        <ErrorState
          message={getApiErrorMessage(error)}
          onRetry={refetch}
        />
        <View style={styles.logoutFloating}>
          <Button label={t('profile.signOut')} variant="secondary" onPress={onLogout} />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.fill}
      data={data ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      onRefresh={refetch}
      refreshing={isRefetching}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <ProgressRow
          session={item}
          onPress={() =>
            navigation.navigate('ActivityDetail', { progressId: item.id })
          }
        />
      )}
      ListEmptyComponent={
        <EmptyState
          icon="hiking"
          title={t('profile.noRoutesTitle')}
          message={t('profile.noRoutesMsg')}
        />
      }
      ListFooterComponent={
        <View style={styles.footer}>
          <Button
            label={t('profile.signOut')}
            variant="secondary"
            icon="logout"
            onPress={onLogout}
          />
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

function ProgressRow({
  session,
  onPress,
}: {
  session: ProgressWithRoute;
  onPress: () => void;
}): React.ReactElement {
  const t = useT();
  const pickLocalized = usePickLocalized();
  const completed = !!session.completedAt;
  const dateLabel = formatDate(session.completedAt ?? session.startedAt);

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.row} elevated={false}>
        <View style={styles.rowHeader}>
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.rowTitle}>
            {pickLocalized(session.route.title)}
          </AppText>
          {session.hidden ? (
            <Badge label={t('profile.hiddenBadge')} color={colors.textMuted} background={colors.surfaceAlt} />
          ) : completed ? (
            <Badge label={t('profile.completedBadge')} color={colors.success} background={colors.primarySoft} />
          ) : (
            <Badge label={t('profile.inProgress')} color={colors.warning} background={colors.warningSoft} />
          )}
        </View>
        <View style={styles.rowRegion}>
          <Icon name="map-marker-outline" size={13} color={colors.textMuted} />
          <AppText variant="caption" color={colors.textSecondary} style={styles.rowRegionText}>
            {pickLocalized(session.route.region)}
          </AppText>
        </View>
        <View style={styles.rowStats}>
          <RowStat icon="map-marker-distance" text={formatDistanceKm(session.totalDistanceKm)} />
          <RowStat icon="timer-outline" text={formatClock(session.movingSeconds)} />
          <RowStat icon="calendar-blank-outline" text={dateLabel} />
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

function RanksSection(): React.ReactElement | null {
  const t = useT();
  const pickLocalized = usePickLocalized();
  const { data, isLoading } = useMyLevels();
  if (isLoading) return null;
  const levels = data ?? [];

  return (
    <View>
      <AppText variant="overline" color={colors.textMuted} style={styles.langTitle}>
        {t('rank.section')}
      </AppText>
      {levels.length === 0 ? (
        <AppText variant="callout" color={colors.textMuted} style={styles.rankEmpty}>
          {t('rank.none')}
        </AppText>
      ) : (
        levels.map((l) => <RankRow key={pickLocalized(l.country)} level={l} />)
      )}
    </View>
  );
}

function RankRow({ level }: { level: CountryLevel }): React.ReactElement {
  const t = useT();
  const pickLocalized = usePickLocalized();
  const maxed = level.xpForNextLevel == null;

  return (
    <Card style={styles.rankCard} elevated={false}>
      <View style={styles.rankHeader}>
        <View style={styles.rankBadge}>
          <AppText variant="bodyStrong" color={colors.textInverse}>
            {level.level}
          </AppText>
        </View>
        <View style={styles.rankText}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {pickLocalized(level.country)}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {pickLocalized(level.rank)} · {t('rank.level', { level: level.level })}
          </AppText>
        </View>
        <View style={styles.rankXp}>
          <Icon name="star-four-points" size={14} color={colors.accent} />
          <AppText variant="caption" color={colors.textSecondary} style={styles.rankXpText}>
            {level.xp} XP
          </AppText>
        </View>
      </View>
      <View style={styles.rankProgressWrap}>
        <ProgressBar value={level.progress} />
        <AppText variant="caption" color={colors.textMuted} style={styles.rankProgressLabel}>
          {maxed
            ? t('rank.maxed')
            : t('rank.xpToNext', {
                into: level.xpIntoLevel,
                total: level.xpForNextLevel ?? 0,
              })}
        </AppText>
      </View>
    </Card>
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
  langTitle: { marginTop: spacing.xxl, marginBottom: spacing.sm },
  langRow: { flexDirection: 'row', flexWrap: 'wrap' },
  rankEmpty: { marginTop: spacing.xs },
  rankCard: { marginTop: spacing.sm, backgroundColor: colors.surface },
  rankHeader: { flexDirection: 'row', alignItems: 'center' },
  rankBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rankText: { flex: 1 },
  rankXp: { flexDirection: 'row', alignItems: 'center', marginLeft: spacing.sm },
  rankXpText: { marginLeft: 4 },
  rankProgressWrap: { marginTop: spacing.md },
  rankProgressLabel: { marginTop: spacing.xs },
  historyTitle: { marginTop: spacing.xl, marginBottom: spacing.md },
  row: { marginBottom: spacing.md, backgroundColor: colors.surface },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitle: { flex: 1, marginRight: spacing.sm },
  rowRegion: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  rowRegionText: { marginLeft: 4 },
  rowStats: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  rowStat: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.lg },
  rowStatText: { marginLeft: 4 },
  rowChevron: { marginLeft: 'auto' },
  footer: { marginTop: spacing.lg },
  logoutFloating: { padding: spacing.xl },
});
