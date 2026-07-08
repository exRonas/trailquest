import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
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
import { colors, shadow, spacing, useThemeColors } from '../../theme';
import { formatClock, formatDate, formatDistanceKm } from '../../utils/format';
import { useAuthStore } from '../../store/authStore';
import { useMyLevel, useMyProgress } from '../../api/hooks/useProgress';
import { useUpdateAvatar } from '../../api/hooks/useUsers';
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
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const language = useLocaleStore((s) => s.language);
  const setLanguage = useLocaleStore((s) => s.setLanguage);
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useMyProgress();
  const [pickerOpen, setPickerOpen] = useState(false);
  const updateAvatar = useUpdateAvatar();

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

  const header = (
    <View>
      <Card style={styles.profileCard}>
        <Pressable onPress={() => setPickerOpen(true)} hitSlop={8}>
          <Avatar name={user?.name ?? 'You'} avatar={user?.avatar} size={64} />
          <View style={[styles.editBadge, { backgroundColor: theme.primary }]}>
            <Icon name="pencil" size={12} color={colors.textInverse} />
          </View>
        </Pressable>
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

      <LevelBlock />

      <PendingSyncBanner />

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

      <View style={styles.historyHeader}>
        <AppText variant="subheading">{t('profile.yourRoutes')}</AppText>
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
    <View style={styles.fill}>
      {picker}
      <FlatList
        style={styles.fill}
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
  const maxed = level.xpForNextLevel == null;

  return (
    <Card style={styles.levelCard} elevated={false}>
      <View style={styles.levelHeader}>
        <View style={[styles.levelBadge, { backgroundColor: theme.primary }]}>
          <AppText variant="bodyStrong" color={colors.textInverse}>
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
          <AppText variant="caption" color={colors.textSecondary} style={styles.levelXpText}>
            {level.xp} XP
          </AppText>
        </View>
      </View>
      <View style={styles.levelProgressWrap}>
        <ProgressBar value={level.progress} />
        <AppText variant="caption" color={colors.textMuted} style={styles.levelProgressLabel}>
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
});
