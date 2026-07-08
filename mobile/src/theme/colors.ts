/**
 * TrailQuest palette — a warm, outdoorsy system built around pine green with a
 * clay-orange accent. Deliberately not the default RN look.
 *
 * Light + dark variants. The exported `colors` is baked from the OS color
 * scheme at module load (see bottom) so static `StyleSheet.create` calls across
 * the app pick up the right neutrals with zero per-component changes. Live
 * theme reactivity for components that need it comes through `useThemeColors()`.
 */

export const palette = {
  // Brand
  pine900: '#0F2C22',
  pine700: '#16513D',
  pine600: '#1F6F54',
  pine500: '#2A8A69',
  pine100: '#E7F2EC',
  pine50: '#F1F8F4',

  // Accent (clay / trail-marker orange)
  clay600: '#C9572A',
  clay500: '#E2703A',
  clay100: '#FBEDE5',

  // Neutrals (slightly green-warm grays)
  ink: '#16201C',
  slate700: '#3A453F',
  slate500: '#5E6B64',
  slate400: '#8A968F',
  slate300: '#B7C0BA',
  mist200: '#E2E6E0',
  mist100: '#EFF2EE',
  paper: '#F7F8F6',
  white: '#FFFFFF',
  black: '#000000',

  // Semantic
  red600: '#C0453E',
  red500: '#D7443E',
  red100: '#FBE9E8',
  amber600: '#B9791C',
  amber500: '#D98A2B',
  amber100: '#FBF0DC',
  blue600: '#2E6FAF',
  blue500: '#357DC2',
  blue100: '#E5EFF8',
  teal600: '#2E8E7E',
  teal100: '#E1F2EF',
  purple600: '#6D4C9F',
} as const;

export type ColorScheme = 'light' | 'dark';

/** Build the full semantic color set for a scheme. Same shape for light/dark
 *  so `typeof lightColors` types both. */
function buildColors(scheme: ColorScheme) {
  const dark = scheme === 'dark';
  return {
    primary: palette.pine600,
    primaryDark: palette.pine700,
    primaryEmphasis: dark ? palette.pine500 : palette.pine900,
    primarySoft: dark ? '#16261F' : palette.pine100,
    primaryTint: dark ? '#12201A' : palette.pine50,

    accent: palette.clay500,
    accentDark: palette.clay600,
    accentSoft: dark ? '#2A1D15' : palette.clay100,

    background: dark ? '#0F1512' : palette.paper,
    surface: dark ? '#171E1A' : palette.white,
    surfaceAlt: dark ? '#1F2823' : palette.mist100,
    border: dark ? '#2A332D' : palette.mist200,
    overlay: dark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(15, 44, 34, 0.55)',

    text: dark ? '#EAF0EC' : palette.ink,
    textSecondary: dark ? '#A6B1AA' : palette.slate500,
    textMuted: dark ? '#78827B' : palette.slate400,
    textInverse: palette.white,

    success: palette.pine500,
    danger: palette.red500,
    dangerSoft: dark ? '#2A1717' : palette.red100,
    warning: palette.amber500,
    warningSoft: dark ? '#2A2414' : palette.amber100,
    info: palette.blue500,
    infoSoft: dark ? '#15202B' : palette.blue100,

    // Checkpoint types (marker + accent colour pairs)
    checkpoint: {
      HISTORICAL: { main: palette.purple600, soft: dark ? '#241E33' : '#EFE9F7' },
      DANGER: { main: palette.red500, soft: dark ? '#2A1717' : palette.red100 },
      UPCOMING: { main: palette.blue500, soft: dark ? '#15202B' : palette.blue100 },
      INFO: { main: palette.teal600, soft: dark ? '#12241F' : palette.teal100 },
    },

    // Route tip types
    tip: {
      WARNING: { main: palette.red500, soft: dark ? '#2A1717' : palette.red100 },
      ADVICE: { main: palette.teal600, soft: dark ? '#12241F' : palette.teal100 },
    },

    // Difficulty
    difficulty: {
      EASY: { main: palette.pine500, soft: dark ? '#16261F' : palette.pine100 },
      MODERATE: { main: palette.amber500, soft: dark ? '#2A2414' : palette.amber100 },
      HARD: { main: palette.red500, soft: dark ? '#2A1717' : palette.red100 },
    },
  };
}

import { Appearance } from 'react-native';

export const lightColors = buildColors('light');
export const darkColors = buildColors('dark');

export type AppColors = typeof lightColors;

// Baked at module load from the OS scheme so static StyleSheets get the right
// neutrals immediately (getColorScheme() is synchronous). Mutated in place by
// applyColorScheme() when the user picks a manual override, so anything reading
// `colors` after that sees the new values (already-created static styles keep
// the boot value until the next launch — the hook path covers live updates).
const bootScheme: ColorScheme =
  Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
export const colors: AppColors = {
  ...(bootScheme === 'dark' ? darkColors : lightColors),
};

export function applyColorScheme(scheme: ColorScheme): void {
  Object.assign(colors, scheme === 'dark' ? darkColors : lightColors);
}

export type CheckpointTypeKey = keyof typeof lightColors.checkpoint;
export type TipTypeKey = keyof typeof lightColors.tip;
export type DifficultyKey = keyof typeof lightColors.difficulty;
