import React, { useEffect } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  AppText,
  Badge,
  Button,
  Card,
  Loader,
} from '../../components/ui';
import { StatTile } from '../../components/StatTile';
import { TrackMap } from '../../components/map/TrackMap';
import { colors, shadow, spacing, useThemeColors } from '../../theme';
import {
  formatClock,
  formatDateTime,
  formatDistanceKm,
} from '../../utils/format';
import { useMyProgress } from '../../api/hooks/useProgress';
import {
  useDeleteProgress,
  useSetProgressVisibility,
} from '../../api/hooks/useProgress';
import { useT, usePickLocalized } from '../../i18n';
import { ProfileScreenProps } from '../../types/navigation';

export function ActivityDetailScreen({
  route,
  navigation,
}: ProfileScreenProps<'ActivityDetail'>): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const pickLocalized = usePickLocalized();
  const { progressId } = route.params;
  const { data } = useMyProgress();
  const session = (data ?? []).find((s) => s.id === progressId);

  const setVisibility = useSetProgressVisibility();
  const deleteProgress = useDeleteProgress();

  useEffect(() => {
    navigation.setOptions({ title: t('activity.title') });
  }, [navigation, t]);

  if (!session) return <Loader message={t('profile.loading')} />;

  const avgSpeed =
    session.movingSeconds > 0
      ? session.totalDistanceKm / (session.movingSeconds / 3600)
      : 0;

  const onShare = () => {
    void Share.share({
      message: t('summary.shareMessage', {
        title: pickLocalized(session.route.title),
        distance: formatDistanceKm(session.totalDistanceKm),
        time: formatClock(session.movingSeconds),
      }),
    });
  };

  const onToggleHide = () => {
    setVisibility.mutate({ progressId, hidden: !session.hidden });
  };

  const onDelete = () => {
    Alert.alert(t('activity.deleteConfirmTitle'), t('activity.deleteConfirmMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteProgress.mutate(
            { progressId },
            { onSuccess: () => navigation.goBack() },
          );
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.titleRow}>
        <AppText variant="title" style={styles.title}>
          {pickLocalized(session.route.title)}
        </AppText>
        {session.completedAt ? (
          <Badge
            label={t('profile.completedBadge')}
            color={theme.primary}
            background={theme.primarySoft}
          />
        ) : (
          <Badge
            label={t('profile.inProgress')}
            color={colors.warning}
            background={colors.warningSoft}
          />
        )}
      </View>
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

      <AppText variant="caption" color={colors.textMuted} style={styles.note}>
        {session.hidden ? t('activity.hiddenNote') : t('activity.visibleNote')}
      </AppText>

      <Button
        label={t('activity.share')}
        icon="share-variant"
        onPress={onShare}
        style={styles.action}
      />
      <Button
        label={session.hidden ? t('activity.unhide') : t('activity.hide')}
        icon={session.hidden ? 'eye-outline' : 'eye-off-outline'}
        variant="secondary"
        onPress={onToggleHide}
        loading={setVisibility.isPending}
        style={styles.action}
      />
      <Button
        label={t('activity.delete')}
        icon="trash-can-outline"
        variant="danger"
        onPress={onDelete}
        loading={deleteProgress.isPending}
        style={styles.action}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.huge },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { flex: 1, marginRight: spacing.sm },
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
  note: { marginTop: spacing.lg, marginBottom: spacing.sm },
  action: { marginTop: spacing.sm },
});
