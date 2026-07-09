import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Chip } from '../ui';
import { spacing, useThemeColors } from '../../theme';
import { categoryIcon, difficultyIcon } from '../../theme/icons';
import { useT } from '../../i18n';
import { Difficulty, RouteCategory, RouteFilters } from '../../types/api';

const CATEGORIES: RouteCategory[] = [
  'HISTORICAL',
  'BATTLE',
  'SCENIC',
  'GATHERING_SPOT',
  'MIXED',
];
const DIFFICULTIES: Difficulty[] = ['EASY', 'MODERATE', 'HARD'];

interface FilterBarProps {
  filters: RouteFilters;
  onChange: (filters: RouteFilters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const toggleCategory = (c: RouteCategory) =>
    onChange({ ...filters, category: filters.category === c ? undefined : c });
  const toggleDifficulty = (d: Difficulty) =>
    onChange({ ...filters, difficulty: filters.difficulty === d ? undefined : d });

  // A wrapping flex layout keeps every chip reachable without a horizontal
  // ScrollView (which conflicts with the bottom-sheet's vertical pan gesture and
  // left the last category off-screen).
  return (
    <View>
      <AppText variant="overline" color={theme.textMuted} style={styles.heading}>
        {t('filter.category')}
      </AppText>
      <View style={styles.row}>
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={t(`category.${c}`)}
            icon={categoryIcon[c]}
            selected={filters.category === c}
            onPress={() => toggleCategory(c)}
          />
        ))}
      </View>

      <AppText variant="overline" color={theme.textMuted} style={styles.heading}>
        {t('filter.difficulty')}
      </AppText>
      <View style={styles.row}>
        {DIFFICULTIES.map((d) => (
          <Chip
            key={d}
            label={t(`difficulty.${d}`)}
            icon={difficultyIcon[d]}
            selected={filters.difficulty === d}
            onPress={() => toggleDifficulty(d)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { marginBottom: spacing.sm, marginTop: spacing.xs },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
});
