import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
// Pressable comes from gesture-handler, not core RN — see Button.tsx for why.
import { Pressable } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  AppText,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Loader,
  ProgressBar,
} from '../../components/ui';
import { Avatar } from '../../components/forum/Avatar';
import { AvatarPicker } from '../../components/AvatarPicker';
import { StatTile } from '../../components/StatTile';
import { ProgressRow } from '../../components/ProgressRow';
import { PendingSyncBanner } from '../../components/PendingSyncBanner';
import { UpdateBanner } from '../../components/UpdateBanner';
import { colors, shadow, spacing, useDesignVersion, useThemeColors } from '../../theme';
import { CloudDrift, MountainScene, Pulse, StampEdge, TopoPattern } from '../../components/decor';
import { formatClock, formatDate, formatDistanceKm } from '../../utils/format';
import { useAuthStore } from '../../store/authStore';
import {
  useAchievements,
  useMyLevel,
  useMyProgress,
} from '../../api/hooks/useProgress';
import { useUpdateAvatar } from '../../api/hooks/useUsers';
import { useFriends } from '../../api/hooks/useFriends';
import { getApiErrorMessage } from '../../api/client';
import { LANGUAGES, useLocaleStore, useT, usePickLocalized } from '../../i18n';
import { LevelInfo } from '../../types/api';
import { ProfileScreenProps } from '../../types/navigation';

/** Only the most recent sessions show inline; the rest live behind "View all". */
const RECENT_COUNT = 3;

export function ProfileScreen({
  navigation,
}: ProfileScreenProps<'Profile'>): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const design = useDesignVersion();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const language = useLocaleStore((s) => s.language);
  const setLanguage = useLocaleStore((s) => s.setLanguage);
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useMyProgress();
  const { data: achievements } = useAchievements();
  const { data: friendsData } = useFriends();
  const incomingCount = friendsData?.incoming.length ?? 0;
  const [pickerOpen, setPickerOpen] = useState(false);
  const updateAvatar = useUpdateAvatar();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('Settings')}
          hitSlop={10}
          style={styles.headerButton}
        >
          <Icon name="cog-outline" size={24} color={theme.primary} />
        </Pressable>
      ),
    });
  }, [navigation, theme.primary]);

  const onSaveAvatar = (avatarId: string | null) => {
    updateAvatar.mutate(avatarId, {
      onSuccess: () => setPickerOpen(false),
      onError: (e) => Alert.alert(t('avatar.saveFailed'), getApiErrorMessage(e)),
    });
  };

  const summary = useMemo(() => {
    const sessions = data ?? [];
    const completed = sessions.filter((s) => s.completedAt);
    const totalKm = sessions.reduce((acc, s) => acc + s.totalDistanceKm, 0);
    const totalSec = sessions.reduce((acc, s) => acc + s.movingSeconds, 0);
    return { completedCount: completed.length, totalKm, totalSec };
  }, [data]);

  const recent = useMemo(() => (data ?? []).slice(0, RECENT_COUNT), [data]);

  const onLogout = () => {
    Alert.alert(t('profile.signOut'), t('profile.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.signOut'), style: 'destructive', onPress: () => void logout() },
    ]);
  };

  const openAllActivities = () => navigation.navigate('AllActivities');

  // Atlas ('v3') hero — expedition-poster header: centered big avatar over a
  // topo-textured card with a layered mountain ridge along the bottom.
  const atlasHero = (
    <View style={[styles.atlasHero, { backgroundColor: theme.primaryTint, borderColor: theme.border }]}>
      <TopoPattern color={theme.primary} opacity={0.2} />
      <CloudDrift color={theme.surface} top={22} size={64} crossSeconds={52} phase={0.25} opacity={0.85} />
      <CloudDrift color={theme.surface} top={64} size={42} crossSeconds={74} phase={0.65} opacity={0.6} />
      <View style={styles.atlasHeroBody}>
        <Pressable onPress={() => setPickerOpen(true)} hitSlop={8}>
          <Avatar name={user?.name ?? 'You'} avatar={user?.avatar} size={84} />
          <View style={[styles.editBadge, { backgroundColor: theme.primary, borderColor: theme.surface }]}>
            <Icon name="pencil" size={12} color={theme.textInverse} />
          </View>
        </Pressable>
        <AppText variant="title" style={styles.atlasName}>
          {user?.name ?? 'Hiker'}
        </AppText>
        <AppText variant="caption" color={theme.textSecondary}>
          {user?.email}
        </AppText>
        {user?.createdAt ? (
          <AppText variant="overline" color={theme.textMuted} style={styles.since}>
            {t('profile.memberSince', { date: formatDate(user.createdAt) })}
          </AppText>
        ) : null}
        {achievements ? (
          <Pulse to={1.045} duration={2600}>
            <Pressable
              style={[styles.achievementsChip, styles.atlasChip, { backgroundColor: theme.accentSoft }]}
              onPress={() => navigation.navigate('Achievements')}
              hitSlop={6}
            >
              <Icon name="trophy" size={18} color={theme.accent} />
              <AppText variant="label" color={theme.accent} style={styles.achievementsChipText}>
                {achievements.filter((a) => a.unlocked).length}/{achievements.length}
              </AppText>
            </Pressable>
          </Pulse>
        ) : null}
      </View>
      <MountainScene
        far={theme.primary}
        mid={theme.primary}
        near={theme.primaryDark}
        sun={theme.accent}
        height={72}
      />
      <StampEdge holeColor={theme.background} />
    </View>
  );

  const header = (
    <View>
      <UpdateBanner />
      {design === 'v3' ? (
        atlasHero
      ) : (
      <Card style={styles.profileCard}>
        <Pressable onPress={() => setPickerOpen(true)} hitSlop={8}>
          <Avatar name={user?.name ?? 'You'} avatar={user?.avatar} size={64} />
          <View style={[styles.editBadge, { backgroundColor: theme.primary, borderColor: theme.surface }]}>
            <Icon name="pencil" size={12} color={theme.textInverse} />
          </View>
        </Pressable>
        <View style={styles.profileText}>
          <AppText variant="heading">{user?.name ?? 'Hiker'}</AppText>
          <AppText variant="callout" color={theme.textSecondary}>
            {user?.email}
          </AppText>
          {user?.createdAt ? (
            <AppText variant="caption" color={theme.textMuted} style={styles.since}>
              {t('profile.memberSince', { date: formatDate(user.createdAt) })}
            </AppText>
          ) : null}
        </View>
        {achievements ? (
          <Pressable
            style={[styles.achievementsChip, { backgroundColor: theme.primarySoft }]}
            onPress={() => navigation.navigate('Achievements')}
            hitSlop={6}
          >
            <Icon name="trophy" size={18} color={theme.primary} />
            <AppText variant="label" color={theme.primary} style={styles.achievementsChipText}>
              {achievements.filter((a) => a.unlocked).length}/{achievements.length}
            </AppText>
          </Pressable>
        ) : null}
      </Card>
      )}

      <LevelBlock />

      <Pressable
        style={
          design === 'v3'
            ? [styles.leaderboardRow, styles.atlasRow, { backgroundColor: theme.surface, borderColor: theme.border }]
            : [styles.leaderboardRow, { backgroundColor: theme.primarySoft }]
        }
        onPress={() => navigation.navigate('Leaderboard')}
      >
        {design === 'v3' ? (
          <View style={[styles.atlasRowIcon, { backgroundColor: theme.primarySoft }]}>
            <Icon name="podium-gold" size={22} color={theme.primary} />
          </View>
        ) : (
          <Icon name="podium-gold" size={22} color={theme.primary} />
        )}
        <View style={styles.leaderboardText}>
          <AppText variant="bodyStrong">{t('leaderboard.title')}</AppText>
          <AppText variant="caption" color={theme.textSecondary}>
            {t('leaderboard.subtitle')}
          </AppText>
        </View>
        <Icon name="chevron-right" size={22} color={design === 'v3' ? theme.accent : theme.textMuted} />
      </Pressable>

      <Pressable
        style={
          design === 'v3'
            ? [styles.leaderboardRow, styles.atlasRow, { backgroundColor: theme.surface, borderColor: theme.border }]
            : [styles.leaderboardRow, { backgroundColor: theme.surface }]
        }
        onPress={() => navigation.navigate('Friends')}
      >
        {design === 'v3' ? (
          <View style={[styles.atlasRowIcon, { backgroundColor: theme.primarySoft }]}>
            <Icon name="account-group" size={22} color={theme.primary} />
          </View>
        ) : (
          <Icon name="account-group" size={22} color={theme.primary} />
        )}
        <View style={styles.leaderboardText}>
          <AppText variant="bodyStrong">{t('friends.title')}</AppText>
        </View>
        {incomingCount > 0 ? (
          <View style={[styles.friendBadge, { backgroundColor: theme.accent }]}>
            <AppText variant="overline" color={theme.textInverse}>
              {incomingCount}
            </AppText>
          </View>
        ) : null}
        <Icon name="chevron-right" size={22} color={design === 'v3' ? theme.accent : theme.textMuted} />
      </Pressable>

      <PendingSyncBanner />

      <View
        style={[
          styles.summary,
          { backgroundColor: design === 'v3' ? theme.primaryTint : theme.surface },
          design === 'v3' ? [styles.atlasSummary, { borderColor: theme.primary }] : null,
        ]}
      >
        {design === 'v3' ? <TopoPattern color={theme.primary} opacity={0.14} /> : null}
        <StatTile
          icon="trophy-outline"
          value={`${summary.completedCount}`}
          label={t('profile.completed')}
        />
        <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
        <StatTile
          icon="map-marker-distance"
          value={formatDistanceKm(summary.totalKm)}
          label={t('profile.totalDist')}
        />
        <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
        <StatTile
          icon="timer-outline"
          value={formatClock(summary.totalSec)}
          label={t('profile.movingTime')}
        />
      </View>

      {/* Language selector */}
      <AppText variant="overline" color={theme.textMuted} style={styles.langTitle}>
        {t('profile.language')}
      </AppText>
      <View style={styles.langRow}>
        {LANGUAGES.map((l) =>
          design === 'v3' ? (
            // Atlas: rubber-stamp pills — dashed frame, uppercase, verdigris
            // ink when selected.
            <Pressable
              key={l.code}
              onPress={() => setLanguage(l.code)}
              style={[
                styles.atlasLangStamp,
                language === l.code
                  ? { backgroundColor: theme.primary, borderColor: theme.primaryDark }
                  : { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <AppText
                variant="overline"
                color={language === l.code ? theme.textInverse : theme.textSecondary}
              >
                {l.label}
              </AppText>
            </Pressable>
          ) : (
            <Chip
              key={l.code}
              label={l.label}
              icon="translate"
              selected={language === l.code}
              onPress={() => setLanguage(l.code)}
            />
          ),
        )}
      </View>

      <View style={styles.historyHeader}>
        <View>
          <AppText variant="subheading">{t('profile.yourRoutes')}</AppText>
          {design === 'v3' ? (
            <View style={[styles.atlasUnderline, { borderColor: theme.accent }]} />
          ) : null}
        </View>
        {(data ?? []).length > RECENT_COUNT ? (
          <Pressable onPress={openAllActivities} hitSlop={8}>
            <AppText variant="bodyStrong" color={theme.primary}>
              {t('profile.viewAll')}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  const picker = (
    <AvatarPicker
      visible={pickerOpen}
      current={user?.avatar}
      saving={updateAvatar.isPending}
      onClose={() => setPickerOpen(false)}
      onSave={onSaveAvatar}
    />
  );

  // Only bail to a full loading/error screen when there's truly nothing
  // cached — a background refetch pausing/failing offline must not blank a
  // screen the user is already looking at (see RouteDetailScreen).
  if (isLoading && !data) return <Loader message={t('profile.loading')} />;
  if (isError && !data) {
    return (
      <View style={[styles.fill, { backgroundColor: theme.background }]}>
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
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      {picker}
      <FlatList
        style={[styles.fill, { backgroundColor: theme.background }]}
        data={recent}
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
    </View>
  );
}

function LevelBlock(): React.ReactElement | null {
  const t = useT();
  const pickLocalized = usePickLocalized();
  const { data: level, isLoading } = useMyLevel();
  if (isLoading || !level) return null;
  return <LevelRow level={level} pickLocalized={pickLocalized} t={t} />;
}

function LevelRow({
  level,
  pickLocalized,
  t,
}: {
  level: LevelInfo;
  pickLocalized: ReturnType<typeof usePickLocalized>;
  t: ReturnType<typeof useT>;
}): React.ReactElement {
  const theme = useThemeColors();
  const design = useDesignVersion();
  const maxed = level.xpForNextLevel == null;

  return (
    <Card
      style={[
        styles.levelCard,
        { backgroundColor: design === 'v3' ? theme.primaryTint : theme.surface },
        design === 'v3' ? [styles.atlasLevelCard, { borderColor: theme.primary }] : null,
      ]}
    >
      {design === 'v3' ? <TopoPattern color={theme.primary} opacity={0.16} /> : null}
      <View style={styles.levelHeader}>
        <View style={[styles.levelBadge, { backgroundColor: theme.primary }]}>
          <AppText variant="bodyStrong" color={theme.textInverse}>
            {level.level}
          </AppText>
        </View>
        <View style={styles.levelText}>
          <AppText variant="bodyStrong">
            {pickLocalized(level.rank)} · {t('rank.level', { level: level.level })}
          </AppText>
        </View>
        <View style={styles.levelXp}>
          <Icon name="star-four-points" size={14} color={colors.accent} />
          <AppText variant="caption" color={theme.textSecondary} style={styles.levelXpText}>
            {level.xp} XP
          </AppText>
        </View>
      </View>
      <View style={styles.levelProgressWrap}>
        <ProgressBar value={level.progress} />
        <AppText variant="caption" color={theme.textMuted} style={styles.levelProgressLabel}>
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
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  since: { marginTop: spacing.xs },
  achievementsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  achievementsChipText: { marginLeft: 4 },
  headerButton: { padding: spacing.xs, marginRight: spacing.xs },
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
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  leaderboardText: { flex: 1, marginLeft: spacing.md },
  friendBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  levelCard: { marginTop: spacing.lg, backgroundColor: colors.surface },
  levelHeader: { flexDirection: 'row', alignItems: 'center' },
  levelBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  levelText: { flex: 1 },
  levelXp: { flexDirection: 'row', alignItems: 'center', marginLeft: spacing.sm },
  levelXpText: { marginLeft: 4 },
  levelProgressWrap: { marginTop: spacing.md },
  levelProgressLabel: { marginTop: spacing.xs },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  footer: { marginTop: spacing.lg },
  logoutFloating: { padding: spacing.xl },

  // Atlas (v3)
  atlasHero: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  atlasHeroBody: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  atlasName: { marginTop: spacing.md },
  atlasChip: { alignSelf: 'center', marginTop: spacing.md },
  // Ledger-form cards: dashed rule frame, like a field-office record sheet.
  atlasLevelCard: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderStyle: 'dashed',
  },
  atlasSummary: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderStyle: 'dashed',
  },
  atlasRow: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10 },
  atlasLangStamp: {
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  atlasRowIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atlasUnderline: {
    width: 42,
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    marginTop: 3,
  },
});
