import { ViewStyle } from 'react-native';
import { palette } from './colors';

/** 4-point spacing scale. */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

/** Elevation presets — soft, low-contrast shadows tuned for the light theme. */
export const shadow: Record<'sm' | 'md' | 'lg', ViewStyle> = {
  sm: {
    shadowColor: palette.pine900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: palette.pine900,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  lg: {
    shadowColor: palette.pine900,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;

export type Spacing = keyof typeof spacing;
