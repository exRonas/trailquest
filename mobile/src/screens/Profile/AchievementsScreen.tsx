import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, Loader } from '../../components/ui';
import { AchievementsSection } from '../../components/AchievementsSection';
import { MountainScene, PatchBadge, TopoPattern } from '../../components/decor';
import { colors, spacing, useDesignVersion, useThemeColors } from '../../theme';
import { useAchievements } from '../../api/hooks/useProgress';
import { useT } from '../../i18n';
import { ProfileScreenProps } from '../../types/navigation';

export function AchievementsScreen({
  navigation,
}: ProfileScreenProps<'Achievements'>): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const design = useDesignVersion();
  const { data, isLoading } = useAchievements();

  useEffect(() => {
    navigation.setOptions({ title: t('achievements.title') });
  }, [navigation, t]);

  if (isLoading && !data) return <Loader message={t('achievements.title')} />;

  const unlocked = (data ?? []).filter((a) => a.unlocked).length;
  const total = (data ?? []).length;

  return (
    <ScrollView
      style={[styles.fill, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {design === 'v3' && total > 0 ? (
        <View
          style={[
            styles.atlasBanner,
            { backgroundColor: theme.primaryTint, borderColor: theme.border },
          ]}
        >
          <TopoPattern color={theme.primary} opacity={0.2} />
          <View style={styles.atlasBannerBody}>
            <PatchBadge fill={theme.primary} stitch={theme.accentSoft} size={72}>
              <Icon name="trophy" size={28} color={theme.textInverse} />
            </PatchBadge>
            <AppText variant="title" style={styles.atlasCount}>
              {unlocked} / {total}
            </AppText>
            <AppText variant="overline" color={theme.textSecondary}>
              {t('achievements.title')}
            </AppText>
          </View>
          <MountainScene
            far={theme.primary}
            mid={theme.primary}
            near={theme.primaryDark}
            sun={theme.accent}
            height={56}
          />
        </View>
      ) : null}
      <AchievementsSection achievements={data ?? []} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.huge },

  // Atlas (v3)
  atlasBanner: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  atlasBannerBody: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  atlasCount: { marginTop: spacing.md },
});
