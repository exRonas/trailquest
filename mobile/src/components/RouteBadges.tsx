import React from 'react';
import { Badge } from './ui';
import { colors } from '../theme';
import { categoryIcon, difficultyIcon } from '../theme/icons';
import { labelForCategory, labelForDifficulty } from '../utils/format';
import { Difficulty, RouteCategory } from '../types/api';

export function DifficultyBadge({
  difficulty,
}: {
  difficulty: Difficulty;
}): React.ReactElement {
  const c = colors.difficulty[difficulty];
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
  return (
    <Badge
      label={labelForCategory(category)}
      color={colors.primary}
      background={colors.primarySoft}
      icon={categoryIcon[category]}
    />
  );
}
