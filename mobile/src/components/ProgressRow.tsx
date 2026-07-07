import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, Badge, Card } from './ui';
import { colors, spacing } from '../theme';
import { formatClock, formatDate, formatDistanceKm } from '../utils/format';
import { useT, usePickLocalized } from '../i18n';
import { ProgressWithRoute } from '../types/api';

interface ProgressRowProps {
  session: ProgressWithRoute;
  onPress: () => void;
}

/** One row in a session history list — Profile's "last 3" and the "view all" screen. */
export function ProgressRow({ session, onPress }: ProgressRowProps): React.ReactElement {
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

const styles = StyleSheet.create({
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
});
