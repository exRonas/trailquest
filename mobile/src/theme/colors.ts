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

/** Three selectable design languages, all kept in the app so they can be
 *  compared side by side:
 *  - 'v1' "Pine" — the original warm green-tinted look.
 *  - 'v2' "Terra" — an editorial style modeled on AllTrails/Airbnb: neutral
 *    true-white surfaces, near-black ink, a single deep forest accent, no
 *    green cast on grays, and a neutral (not green) dark mode.
 *  - 'v3' "Atlas" — expedition / vintage-field-guide: warm cream paper,
 *    olive-green primary, terracotta accent, serif display type and SVG
 *    decor (topo contours, mountain scenes, scout patches).
 */
export type DesignVersion = 'v1' | 'v2' | 'v3';

/** Terra additions to the raw palette. */
export const terra = {
  forest700: '#14472F',
  forest600: '#1D5C3E',
  forest500: '#2A7A53',
  forest200: '#BFD9CC',
  forest100: '#E9F1EC',
  forest50: '#F3F7F4',

  ink: '#1C1D1B',
  gray600: '#5F615C',
  gray400: '#9A9C96',
  gray200: '#E7E7E3',
  gray100: '#F4F4F1',
  paper: '#FBFBF9',

  // Neutral charcoal dark mode (iOS-like, no green cast)
  night900: '#151715',
  night800: '#1E211E',
  night700: '#262A26',
  night600: '#363A36',
} as const;

/** Atlas ('v3') additions — aged industrial-era palette: yellowed archive
 *  paper, verdigris (oxidized copper) as the working green, rust iron as the
 *  accent, and a soot-and-lamplight dark mode. Vintage postage-stamp /
 *  factory-ledger feel rather than a fresh outdoorsy green. */
export const atlas = {
  // Verdigris — the green of weathered copper roofs and old machinery paint
  verdigris700: '#2E4C43',
  verdigris600: '#3D6156',
  verdigris500: '#4E7568',
  verdigris200: '#BCD0C6',
  verdigris100: '#DEE8E1',
  verdigris50: '#EDF2EC',

  // Rust — oxidized iron, stamps' cancellation-ink red
  rust600: '#8F3A18',
  rust500: '#AE4A22',
  rust100: '#F2DCC8',

  // Aged archive-paper neutrals (yellowed, sepia-leaning)
  ink: '#2F2A1D',
  umber600: '#6E6450',
  umber400: '#9B8F74',
  sand300: '#D6C8A8',
  sand200: '#E5DABE',
  sand100: '#EDE3CC',
  paper: '#F4ECD9',
  parchment: '#FBF5E4',

  // Soot-and-lamplight dark mode — coal blacks with a warm cast
  night900: '#191612',
  night800: '#231F18',
  night700: '#2D281F',
  night600: '#413A2C',
} as const;

/** Build the full semantic color set for a scheme. Same shape for light/dark
 *  so `typeof lightColors` types both. */
function buildColors(scheme: ColorScheme) {
  const dark = scheme === 'dark';
  // Soft charcoal-green dark theme (not near-black) — a warm dark graphite
  // that stays legible and easy on the eyes rather than a stark AMOLED black.
  return {
    primary: dark ? palette.pine500 : palette.pine600,
    primaryDark: palette.pine700,
    primaryEmphasis: dark ? palette.pine500 : palette.pine900,
    primarySoft: dark ? '#22322A' : palette.pine100,
    primaryTint: dark ? '#1C2922' : palette.pine50,

    accent: palette.clay500,
    accentDark: palette.clay600,
    accentSoft: dark ? '#33251A' : palette.clay100,

    background: dark ? '#1B2320' : palette.paper,
    surface: dark ? '#242E29' : palette.white,
    surfaceAlt: dark ? '#2C3730' : palette.mist100,
    border: dark ? '#3C4A41' : palette.mist200,
    overlay: dark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(15, 44, 34, 0.55)',

    text: dark ? '#EDF2EE' : palette.ink,
    textSecondary: dark ? '#BAC5BE' : palette.slate500,
    textMuted: dark ? '#8CA396' : palette.slate400,
    textInverse: palette.white,

    success: palette.pine500,
    danger: palette.red500,
    dangerSoft: dark ? '#332020' : palette.red100,
    warning: palette.amber500,
    warningSoft: dark ? '#332B1C' : palette.amber100,
    info: palette.blue500,
    infoSoft: dark ? '#1E2A34' : palette.blue100,

    // Checkpoint types (marker + accent colour pairs)
    checkpoint: {
      HISTORICAL: { main: palette.purple600, soft: dark ? '#2C2640' : '#EFE9F7' },
      DANGER: { main: palette.red500, soft: dark ? '#332020' : palette.red100 },
      UPCOMING: { main: palette.blue500, soft: dark ? '#1E2A34' : palette.blue100 },
      INFO: { main: palette.teal600, soft: dark ? '#1B2E28' : palette.teal100 },
    },

    // Route tip types
    tip: {
      WARNING: { main: palette.red500, soft: dark ? '#332020' : palette.red100 },
      ADVICE: { main: palette.teal600, soft: dark ? '#1B2E28' : palette.teal100 },
    },

    // Difficulty
    difficulty: {
      EASY: { main: palette.pine500, soft: dark ? '#22322A' : palette.pine100 },
      MODERATE: { main: palette.amber500, soft: dark ? '#332B1C' : palette.amber100 },
      HARD: { main: palette.red500, soft: dark ? '#332020' : palette.red100 },
    },
  };
}

/** Terra ('v2') semantic set. Shares the semantic sub-palettes (checkpoint /
 *  tip / difficulty severity hues) with v1 so map markers and badges keep
 *  their recognizable meaning; everything chrome-level goes neutral. */
function buildTerraColors(scheme: ColorScheme) {
  const dark = scheme === 'dark';
  const v1 = buildColors(scheme);
  return {
    ...v1,

    primary: dark ? terra.forest500 : terra.forest600,
    primaryDark: terra.forest700,
    primaryEmphasis: dark ? terra.forest200 : terra.forest700,
    primarySoft: dark ? '#24312A' : terra.forest100,
    primaryTint: dark ? '#1D2620' : terra.forest50,

    accent: palette.clay500,
    accentDark: palette.clay600,
    accentSoft: dark ? '#33251A' : palette.clay100,

    background: dark ? terra.night900 : terra.paper,
    surface: dark ? terra.night800 : palette.white,
    surfaceAlt: dark ? terra.night700 : terra.gray100,
    border: dark ? terra.night600 : terra.gray200,
    overlay: dark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(20, 22, 20, 0.5)',

    text: dark ? '#F2F3F0' : terra.ink,
    textSecondary: dark ? '#B5B8B2' : terra.gray600,
    textMuted: dark ? '#878A84' : terra.gray400,

    success: terra.forest500,
  };
}

/** Atlas ('v3') semantic set. Keeps the severity sub-palettes recognizable
 *  (difficulty stays traffic-light) but re-tints everything chrome-level to
 *  the warm expedition paper + olive + terracotta scheme. */
function buildAtlasColors(scheme: ColorScheme) {
  const dark = scheme === 'dark';
  const v1 = buildColors(scheme);
  return {
    ...v1,

    primary: dark ? atlas.verdigris500 : atlas.verdigris600,
    primaryDark: atlas.verdigris700,
    primaryEmphasis: dark ? atlas.verdigris200 : atlas.verdigris700,
    primarySoft: dark ? '#293630' : atlas.verdigris100,
    primaryTint: dark ? '#222C27' : atlas.verdigris50,

    accent: atlas.rust500,
    accentDark: atlas.rust600,
    accentSoft: dark ? '#3B2A1C' : atlas.rust100,

    background: dark ? atlas.night900 : atlas.paper,
    surface: dark ? atlas.night800 : atlas.parchment,
    surfaceAlt: dark ? atlas.night700 : atlas.sand100,
    border: dark ? atlas.night600 : atlas.sand300,
    overlay: dark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(47, 42, 29, 0.55)',

    text: dark ? '#EFE7D2' : atlas.ink,
    textSecondary: dark ? '#C7BBA0' : atlas.umber600,
    textMuted: dark ? '#96896E' : atlas.umber400,

    success: atlas.verdigris500,

    difficulty: {
      EASY: { main: atlas.verdigris500, soft: dark ? '#293630' : atlas.verdigris100 },
      MODERATE: v1.difficulty.MODERATE,
      HARD: v1.difficulty.HARD,
    },
  };
}

import { Appearance } from 'react-native';

export const lightColors = buildColors('light');
export const darkColors = buildColors('dark');

// Widen the `as const` palette literals to plain strings so both design
// versions' sets (which use different hex values) satisfy the same shape.
type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };
export type AppColors = Widen<typeof lightColors>;

/** All four baked color sets, addressable by design version + scheme. */
export const colorSets: Record<DesignVersion, Record<ColorScheme, AppColors>> = {
  v1: { light: lightColors, dark: darkColors },
  v2: { light: buildTerraColors('light'), dark: buildTerraColors('dark') },
  v3: { light: buildAtlasColors('light'), dark: buildAtlasColors('dark') },
};

// The design version behind the mutable `colors` object. Persisted prefs load
// asynchronously, so boot always starts on v1 until the design store hydrates.
let activeDesign: DesignVersion = 'v1';

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
  Object.assign(colors, colorSets[activeDesign][scheme]);
}

/** Switch the active design language (and re-resolve the current scheme).
 *  Same live-update contract as applyColorScheme: hook consumers update
 *  immediately, static StyleSheets keep their boot values. */
export function applyDesign(design: DesignVersion, scheme: ColorScheme): void {
  activeDesign = design;
  Object.assign(colors, colorSets[design][scheme]);
}

export type CheckpointTypeKey = keyof typeof lightColors.checkpoint;
export type TipTypeKey = keyof typeof lightColors.tip;
export type DifficultyKey = keyof typeof lightColors.difficulty;
