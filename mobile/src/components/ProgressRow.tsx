import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, Badge, Card } from './ui';
import { spacing, useDesignVersion, useThemeColors } from '../theme';
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
  const theme = useThemeColors();
  const design = useDesignVersion();
  const pickLocalized = usePickLocalized();
  const completed = !!session.completedAt;
  const dateLabel = formatDate(session.completedAt ?? session.startedAt);
  // Atlas: a status spine down the left edge — olive when the log entry is
  // a completed hike, amber while still in progress, gray when hidden.
  const spineColor = session.hidden
    ? theme.textMuted
    : completed
      ? theme.success
      : theme.warning;

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.row} elevated={false}>
        {design === 'v3' ? (
          <View style={[styles.atlasSpine, { backgroundColor: spineColor }]} />
        ) : null}
        <View style={styles.rowHeader}>
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.rowTitle}>
            {pickLocalized(session.route.title)}
          </AppText>
          {session.hidden ? (
            <Badge label={t('profile.hiddenBadge')} color={theme.textMuted} background={theme.surfaceAlt} />
          ) : completed ? (
            <Badge label={t('profile.completedBadge')} color={theme.primary} background={theme.primarySoft} />
          ) : (
            <Badge label={t('profile.inProgress')} color={theme.warning} background={theme.warningSoft} />
          )}
        </View>
        <View style={styles.rowRegion}>
          <Icon name="map-marker-outline" size={13} color={theme.textMuted} />
          <AppText variant="caption" color={theme.textSecondary} style={styles.rowRegionText}>
            {pickLocalized(session.route.region)}
          </AppText>
        </View>
        <View
          style={[
            styles.rowStats,
            design === 'v3' ? [styles.atlasStatsDivider, { borderColor: theme.border }] : null,
          ]}
        >
          <RowStat icon="map-marker-distance" text={formatDistanceKm(session.totalDistanceKm)} />
          <RowStat icon="timer-outline" text={formatClock(session.movingSeconds)} />
          <RowStat icon="calendar-blank-outline" text={dateLabel} />
          <Icon
            name="chevron-right"
            size={20}
            color={design === 'v3' ? theme.accent : theme.textMuted}
            style={styles.rowChevron}
          />
        </View>
      </Card>
    </Pressable>
  );
}

function RowStat({ icon, text }: { icon: string; text: string }): React.ReactElement {
  const theme = useThemeColors();
  const design = useDesignVersion();
  return (
    <View style={styles.rowStat}>
      <Icon name={icon} size={14} color={design === 'v3' ? theme.accent : theme.primary} />
      <AppText variant="label" color={theme.textSecondary} style={styles.rowStatText}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: spacing.md },
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

  // Atlas (v3)
  atlasSpine: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  atlasStatsDivider: {
    borderTopWidth: 1.2,
    borderStyle: 'dashed',
    paddingTop: spacing.sm,
  },
});
