import React from 'react';
import { Badge } from './ui';
import { colors, useThemeColors } from '../theme';
import { blend, lighten } from '../theme/shade';
import { categoryIcon, difficultyIcon } from '../theme/icons';
import { labelForCategory, labelForDifficulty } from '../utils/format';
import { Difficulty, RouteCategory } from '../types/api';

/** How much of the profile accent to fold into each severity color — enough
 *  to feel on-theme, low enough that green/amber/red stay unmistakable. */
const HARMONIZE_AMOUNT = 0.22;

export function DifficultyBadge({
  difficulty,
}: {
  difficulty: Difficulty;
}): React.ReactElement {
  const theme = useThemeColors();
  // Traffic-light severity (green=easy, amber=moderate, red=hard) always
  // stays the recognizable cue, just tinted toward the user's chosen accent
  // so it doesn't look like a foreign color dropped onto the theme.
  const main = blend(colors.difficulty[difficulty].main, theme.primary, HARMONIZE_AMOUNT);
  const c = { main, soft: lighten(main, 0.82) };
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
