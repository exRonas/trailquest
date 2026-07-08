import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from './ui';
import { colors, spacing, useThemeColors } from '../theme';
import { useT, usePickLocalized } from '../i18n';
import { Achievement } from '../types/api';

/**
 * Badge grid for the Profile. Unlocked badges show in the accent color; locked
 * ones are greyed with a "current/threshold" hint so the user sees how close
 * they are.
 */
export function AchievementsSection({
  achievements,
}: {
  achievements: Achievement[];
}): React.ReactElement | null {
  const t = useT();
  const theme = useThemeColors();
  if (achievements.length === 0) return null;
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <View>
      <View style={styles.header}>
        <AppText variant="subheading">{t('achievements.title')}</AppText>
        <AppText variant="callout" color={colors.textSecondary}>
          {t('achievements.count', { unlocked, total: achievements.length })}
        </AppText>
      </View>
      <View style={styles.grid}>
        {achievements.map((a) => (
          <Badge key={a.id} achievement={a} accent={theme.primary} />
        ))}
      </View>
    </View>
  );
}

function Badge({
  achievement,
  accent,
}: {
  achievement: Achievement;
  accent: string;
}): React.ReactElement {
  const t = useT();
  const pickLocalized = usePickLocalized();
  const { unlocked } = achievement;
  return (
    <View style={styles.badge}>
      <View
        style={[
          styles.disc,
          {
            backgroundColor: unlocked ? accent : colors.surfaceAlt,
            borderColor: unlocked ? accent : colors.border,
          },
        ]}
      >
        <Icon
          name={achievement.icon}
          size={26}
          color={unlocked ? colors.textInverse : colors.textMuted}
        />
      </View>
      <AppText
        variant="label"
        center
        numberOfLines={2}
        color={unlocked ? colors.text : colors.textMuted}
        style={styles.badgeTitle}
      >
        {pickLocalized(achievement.title)}
      </AppText>
      {!unlocked ? (
        <AppText variant="overline" center color={colors.textMuted}>
          {t('achievements.progress', {
            current: Math.floor(achievement.current),
            threshold: achievement.threshold,
          })}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  badge: {
    width: '33.33%',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  disc: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  badgeTitle: { minHeight: 32 },
});
