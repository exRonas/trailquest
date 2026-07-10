import React, { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Chip } from '../ui';
import { spacing, useDesignVersion, useThemeColors, ThemeColors } from '../../theme';
import { categoryIcon, difficultyIcon } from '../../theme/icons';
import { CategoryIcon, GaugeIcon, FilterIconHandle } from './FilterIcons';
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
  const design = useDesignVersion();
  // Each animated filter icon exposes an imperative play(); triggering via
  // refs keeps taps from causing any extra renders (see FilterIcons.tsx).
  const categoryIconRefs = useRef<Partial<Record<RouteCategory, FilterIconHandle | null>>>({});
  const gaugeRefs = useRef<Partial<Record<Difficulty, FilterIconHandle | null>>>({});
  const toggleCategory = (c: RouteCategory) => {
    categoryIconRefs.current[c]?.play();
    onChange({ ...filters, category: filters.category === c ? undefined : c });
  };
  const toggleDifficulty = (d: Difficulty) => {
    gaugeRefs.current[d]?.play();
    onChange({ ...filters, difficulty: filters.difficulty === d ? undefined : d });
  };

  if (design === 'v3') {
    // Atlas: field-guide tiles — square icon tiles for categories, one
    // color-graded row for difficulty. Structure over chips: the tap targets
    // are bigger and the selected state reads at a glance.
    return (
      <View>
        <AppText variant="overline" color={theme.textMuted} style={styles.heading}>
          {t('filter.category')}
        </AppText>
        <View style={styles.tileRow}>
          {CATEGORIES.map((c) => {
            const selected = filters.category === c;
            return (
              <Pressable
                key={c}
                onPress={() => toggleCategory(c)}
                style={[
                  styles.tile,
                  {
                    backgroundColor: selected ? theme.primary : theme.surfaceAlt,
                    borderColor: selected ? theme.primaryDark : theme.border,
                  },
                ]}
              >
                <CategoryIcon
                  ref={(h) => {
                    categoryIconRefs.current[c] = h;
                  }}
                  category={c}
                  size={22}
                  color={selected ? theme.textInverse : theme.primary}
                />
                <AppText
                  variant="label"
                  center
                  numberOfLines={2}
                  color={selected ? theme.textInverse : theme.textSecondary}
                  style={styles.tileLabel}
                >
                  {t(`category.${c}`)}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <AppText variant="overline" color={theme.textMuted} style={styles.heading}>
          {t('filter.difficulty')}
        </AppText>
        <View style={styles.gradeRow}>
          {DIFFICULTIES.map((d, i) => (
            <GradeSegment
              key={d}
              difficulty={d}
              selected={filters.difficulty === d}
              first={i === 0}
              last={i === DIFFICULTIES.length - 1}
              label={t(`difficulty.${d}`)}
              theme={theme}
              iconRef={(h) => {
                gaugeRefs.current[d] = h;
              }}
              onPress={() => toggleDifficulty(d)}
            />
          ))}
        </View>
      </View>
    );
  }

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

/** One third of the Atlas difficulty control — a joined segmented bar where
 *  each segment carries its severity color (green/amber/red). */
function GradeSegment({
  difficulty,
  selected,
  first,
  last,
  label,
  theme,
  iconRef,
  onPress,
}: {
  difficulty: Difficulty;
  selected: boolean;
  first: boolean;
  last: boolean;
  label: string;
  theme: ThemeColors;
  iconRef: (h: FilterIconHandle | null) => void;
  onPress: () => void;
}): React.ReactElement {
  const c = theme.difficulty[difficulty];
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.grade,
        first ? styles.gradeFirst : null,
        last ? styles.gradeLast : null,
        {
          backgroundColor: selected ? c.main : c.soft,
          borderColor: selected ? c.main : theme.border,
        },
      ]}
    >
      <GaugeIcon
        ref={iconRef}
        difficulty={difficulty}
        size={20}
        color={selected ? theme.textInverse : c.main}
      />
      <AppText
        variant="label"
        color={selected ? theme.textInverse : c.main}
        style={styles.gradeLabel}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heading: { marginBottom: spacing.sm, marginTop: spacing.xs },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },

  // Atlas (v3)
  tileRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
    marginHorizontal: -spacing.xs / 2,
  },
  tile: {
    width: '18.4%',
    marginHorizontal: '0.8%',
    marginBottom: spacing.sm,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
  },
  tileLabel: { marginTop: 4, fontSize: 10, lineHeight: 12 },
  gradeRow: { flexDirection: 'row', marginBottom: spacing.sm },
  grade: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginLeft: -StyleSheet.hairlineWidth,
  },
  gradeFirst: { borderTopLeftRadius: 14, borderBottomLeftRadius: 14, marginLeft: 0 },
  gradeLast: { borderTopRightRadius: 14, borderBottomRightRadius: 14 },
  gradeLabel: { marginLeft: 6 },
});
