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

export {
  colors,
  palette,
  terra,
  lightColors,
  darkColors,
  colorSets,
  applyColorScheme,
  applyDesign,
} from './colors';
export type { ColorScheme, AppColors, DesignVersion } from './colors';
export { useDesignStore, useDesignVersion, DESIGN_VERSIONS } from './designStore';
export { typography, fontFamily, fontFamilyMedium } from './typography';
export { spacing, radius, shadow, hitSlop } from './layout';
export { useThemeColors, useIsDark } from './useThemeColors';
export type { ThemeColors } from './useThemeColors';
export { useThemeStore, resolveScheme, THEME_MODES } from './themeStore';
export type { ThemeMode } from './themeStore';
export type {
  CheckpointTypeKey,
  TipTypeKey,
  DifficultyKey,
} from './colors';
export type { TypographyVariant } from './typography';
