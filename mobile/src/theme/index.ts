import { colors, palette } from './colors';
import { typography, fontFamily, fontFamilyMedium } from './typography';
import { spacing, radius, shadow, hitSlop } from './layout';

export const theme = {
  colors,
  palette,
  typography,
  fontFamily,
  fontFamilyMedium,
  spacing,
  radius,
  shadow,
  hitSlop,
} as const;

export type AppTheme = typeof theme;

export { colors, palette } from './colors';
export { typography, fontFamily, fontFamilyMedium } from './typography';
export { spacing, radius, shadow, hitSlop } from './layout';
export { useThemeColors } from './useThemeColors';
export type { ThemeColors } from './useThemeColors';
export type {
  CheckpointTypeKey,
  TipTypeKey,
  DifficultyKey,
} from './colors';
export type { TypographyVariant } from './typography';
