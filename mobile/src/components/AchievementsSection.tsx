import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, ProgressBar } from './ui';
import { PatchBadge } from './decor';
import { radius, spacing, useDesignVersion, useThemeColors, ThemeColors } from '../theme';
import { useT, usePickLocalized } from '../i18n';
import { Achievement } from '../types/api';

/**
 * Badge grid for the Profile. Unlocked badges show in the accent color; locked
 * ones are greyed with a "current/threshold" hint. Tapping a badge opens a
 * detail popup with its full description and progress.
 */
export function AchievementsSection({
  achievements,
}: {
  achievements: Achievement[];
}): React.ReactElement | null {
  const t = useT();
  const theme = useThemeColors();
  const [selected, setSelected] = useState<Achievement | null>(null);
  if (achievements.length === 0) return null;
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <View>
      <View style={styles.header}>
        <AppText variant="subheading">{t('achievements.title')}</AppText>
        <AppText variant="callout" color={theme.textSecondary}>
          {t('achievements.count', { unlocked, total: achievements.length })}
        </AppText>
      </View>
      <View style={styles.grid}>
        {achievements.map((a) => (
          <Badge
            key={a.id}
            achievement={a}
            theme={theme}
            onPress={() => setSelected(a)}
          />
        ))}
      </View>

      <AchievementModal
        achievement={selected}
        theme={theme}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

function Badge({
  achievement,
  theme,
  onPress,
}: {
  achievement: Achievement;
  theme: ThemeColors;
  onPress: () => void;
}): React.ReactElement {
  const t = useT();
  const pickLocalized = usePickLocalized();
  const design = useDesignVersion();
  const { unlocked } = achievement;
  return (
    <Pressable style={styles.badge} onPress={onPress} hitSlop={4}>
      {design === 'v3' ? (
        // Atlas: scout-patch style — scalloped disc with a stitch ring.
        <View style={styles.patchWrap}>
          <PatchBadge
            fill={unlocked ? theme.primary : theme.surfaceAlt}
            stitch={unlocked ? theme.accentSoft : theme.border}
            size={62}
            muted={!unlocked}
          >
            <Icon
              name={achievement.icon}
              size={24}
              color={unlocked ? theme.textInverse : theme.textMuted}
            />
          </PatchBadge>
        </View>
      ) : (
      <View
        style={[
          styles.disc,
          {
            backgroundColor: unlocked ? theme.primary : theme.surfaceAlt,
            borderColor: unlocked ? theme.primary : theme.border,
          },
        ]}
      >
        <Icon
          name={achievement.icon}
          size={26}
          color={unlocked ? theme.textInverse : theme.textMuted}
        />
      </View>
      )}
      <AppText
        variant="label"
        center
        numberOfLines={2}
        color={unlocked ? theme.text : theme.textMuted}
        style={styles.badgeTitle}
      >
        {pickLocalized(achievement.title)}
      </AppText>
      {!unlocked ? (
        <AppText variant="overline" center color={theme.textMuted}>
          {t('achievements.progress', {
            current: Math.floor(achievement.current),
            threshold: achievement.threshold,
          })}
        </AppText>
      ) : null}
    </Pressable>
  );
}

function AchievementModal({
  achievement,
  theme,
  onClose,
}: {
  achievement: Achievement | null;
  theme: ThemeColors;
  onClose: () => void;
}): React.ReactElement {
  const t = useT();
  const pickLocalized = usePickLocalized();
  const a = achievement;
  return (
    <Modal
      visible={!!a}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.backdrop, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          {a ? (
            <>
              <View
                style={[
                  styles.bigDisc,
                  {
                    backgroundColor: a.unlocked ? theme.primary : theme.surfaceAlt,
                    borderColor: a.unlocked ? theme.primary : theme.border,
                  },
                ]}
              >
                <Icon
                  name={a.icon}
                  size={44}
                  color={a.unlocked ? theme.textInverse : theme.textMuted}
                />
              </View>
              <AppText variant="heading" center style={styles.modalTitle}>
                {pickLocalized(a.title)}
              </AppText>
              <AppText
                variant="callout"
                center
                color={theme.textSecondary}
                style={styles.modalDesc}
              >
                {pickLocalized(a.description)}
              </AppText>
              {a.unlocked ? (
                <View style={[styles.unlockedPill, { backgroundColor: theme.primarySoft }]}>
                  <Icon name="check-circle" size={16} color={theme.primary} />
                  <AppText variant="label" color={theme.primary} style={styles.unlockedText}>
                    {t('achievements.unlocked')}
                  </AppText>
                </View>
              ) : (
                <View style={styles.progressWrap}>
                  <ProgressBar value={a.progress} />
                  <AppText variant="caption" center color={theme.textMuted} style={styles.progressText}>
                    {t('achievements.progress', {
                      current: Math.floor(a.current),
                      threshold: a.threshold,
                    })}
                  </AppText>
                </View>
              )}
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
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
  patchWrap: { marginBottom: spacing.xs },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  bigDisc: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: { marginBottom: spacing.sm },
  modalDesc: { marginBottom: spacing.lg },
  unlockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  unlockedText: { marginLeft: spacing.xs },
  progressWrap: { width: '100%' },
  progressText: { marginTop: spacing.sm },
});
