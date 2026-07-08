import React from 'react';
import { Badge } from './ui';
import { colors, useThemeColors } from '../theme';
import { categoryIcon, difficultyIcon } from '../theme/icons';
import { labelForCategory, labelForDifficulty } from '../utils/format';
import { Difficulty, RouteCategory } from '../types/api';

export function DifficultyBadge({
  difficulty,
}: {
  difficulty: Difficulty;
}): React.ReactElement {
  const theme = useThemeColors();
  // EASY tracks the brand accent (it's a "safe/on-brand" tier, not a hazard
  // color); MODERATE/HARD keep fixed amber/red — universal severity cues that
  // shouldn't shift with the user's chosen accent.
  const c =
    difficulty === 'EASY'
      ? { main: theme.primary, soft: theme.primarySoft }
      : colors.difficulty[difficulty];
  return (
    <Badge
      label={labelForDifficulty(difficulty)}
      color={c.main}
      background={c.soft}
      icon={difficultyIcon[difficulty]}
    />
  );
}

export function CategoryBadge({
  category,
}: {
  category: RouteCategory;
}): React.ReactElement {
  const theme = useThemeColors();
  return (
    <Badge
      label={labelForCategory(category)}
      color={theme.primary}
      background={theme.primarySoft}
      icon={categoryIcon[category]}
    />
  );
}
