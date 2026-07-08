import React, { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Loader } from '../../components/ui';
import { AchievementsSection } from '../../components/AchievementsSection';
import { colors, spacing, useThemeColors } from '../../theme';
import { useAchievements } from '../../api/hooks/useProgress';
import { useT } from '../../i18n';
import { ProfileScreenProps } from '../../types/navigation';

export function AchievementsScreen({
  navigation,
}: ProfileScreenProps<'Achievements'>): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const { data, isLoading } = useAchievements();

  useEffect(() => {
    navigation.setOptions({ title: t('achievements.title') });
  }, [navigation, t]);

  if (isLoading && !data) return <Loader message={t('achievements.title')} />;

  return (
    <ScrollView
      style={[styles.fill, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AchievementsSection achievements={data ?? []} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.huge },
});
