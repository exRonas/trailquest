/**
 * TrailQuest palette — a warm, outdoorsy system built around pine green with a
 * clay-orange accent. Deliberately not the default RN look.
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

export const colors = {
  primary: palette.pine600,
  primaryDark: palette.pine700,
  primaryEmphasis: palette.pine900,
  primarySoft: palette.pine100,
  primaryTint: palette.pine50,

  accent: palette.clay500,
  accentDark: palette.clay600,
  accentSoft: palette.clay100,

  background: palette.paper,
  surface: palette.white,
  surfaceAlt: palette.mist100,
  border: palette.mist200,
  overlay: 'rgba(15, 44, 34, 0.55)',

  text: palette.ink,
  textSecondary: palette.slate500,
  textMuted: palette.slate400,
  textInverse: palette.white,

  success: palette.pine500,
  danger: palette.red500,
  dangerSoft: palette.red100,
  warning: palette.amber500,
  warningSoft: palette.amber100,
  info: palette.blue500,
  infoSoft: palette.blue100,

  // Checkpoint types (marker + accent colour pairs)
  checkpoint: {
    HISTORICAL: { main: palette.purple600, soft: '#EFE9F7' },
    DANGER: { main: palette.red500, soft: palette.red100 },
    UPCOMING: { main: palette.blue500, soft: palette.blue100 },
    INFO: { main: palette.teal600, soft: palette.teal100 },
  },

  // Route tip types
  tip: {
    WARNING: { main: palette.red500, soft: palette.red100 },
    ADVICE: { main: palette.teal600, soft: palette.teal100 },
  },

  // Difficulty
  difficulty: {
    EASY: { main: palette.pine500, soft: palette.pine100 },
    MODERATE: { main: palette.amber500, soft: palette.amber100 },
    HARD: { main: palette.red500, soft: palette.red100 },
  },
} as const;

export type CheckpointTypeKey = keyof typeof colors.checkpoint;
export type TipTypeKey = keyof typeof colors.tip;
export type DifficultyKey = keyof typeof colors.difficulty;
