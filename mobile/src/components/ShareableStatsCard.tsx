import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from './ui';
import { colors, radius, spacing } from '../theme';

export interface ShareStat {
  icon: string;
  value: string;
  label: string;
}

/**
 * A branded, self-contained stats card rendered off-screen and captured to a
 * PNG for sharing (see services/shareCard.ts). Deliberately uses fixed colors
 * (not the live theme) and no native map view so the capture is stable and
 * always looks like a polished share card regardless of light/dark mode.
 */
export const ShareableStatsCard = React.forwardRef<
  View,
  { title: string; stats: ShareStat[] }
>(function ShareableStatsCard({ title, stats }, ref) {
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <View style={styles.brandRow}>
        <Icon name="hiking" size={22} color={colors.textInverse} />
        <AppText variant="bodyStrong" color={colors.textInverse} style={styles.brand}>
          TrailQuest
        </AppText>
      </View>

      <View style={styles.trophyRow}>
        <Icon name="trophy" size={28} color="#FFD772" />
      </View>
      <AppText variant="title" color={colors.textInverse} center style={styles.title}>
        {title}
      </AppText>

      <View style={styles.statsGrid}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            <Icon name={s.icon} size={20} color="#FFD772" />
            <AppText variant="heading" color={colors.textInverse} style={styles.statValue}>
              {s.value}
            </AppText>
            <AppText variant="label" color="rgba(255,255,255,0.75)">
              {s.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 360,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xxl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  brand: { marginLeft: spacing.sm, letterSpacing: 1 },
  trophyRow: { alignItems: 'center', marginBottom: spacing.sm },
  title: { marginBottom: spacing.xl },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  stat: {
    width: '46%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statValue: { marginTop: spacing.xs, marginBottom: 2 },
});
