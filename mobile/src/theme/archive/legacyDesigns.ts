/**
 * ARCHIVED — not imported anywhere in the live app.
 *
 * TrailQuest used to ship three switchable design languages: 'v1' Pine,
 * 'v2' Terra, and 'v3' Atlas. Atlas won and the switcher was removed
 * (Settings > Appearance no longer has a "Design" row); the app now always
 * renders Atlas — see `../colors.ts` / `../typography.ts`.
 *
 * This file is a frozen snapshot of the two retired designs' definitions,
 * kept for reference / in case either look is ever wanted again. It is
 * self-contained (duplicates the small bit of shared scaffolding it needs)
 * rather than importing from the live theme, so it keeps working even as
 * the active theme files evolve.
 */

import { Platform, TextStyle } from 'react-native';

export type ColorScheme = 'light' | 'dark';

// ---------------------------------------------------------------------
// Pine ('v1') — the original warm green-tinted look.
// ---------------------------------------------------------------------

export const pinePalette = {
  pine900: '#0F2C22',
  pine700: '#16513D',
  pine600: '#1F6F54',
  pine500: '#2A8A69',
  pine100: '#E7F2EC',
  pine50: '#F1F8F4',

  clay600: '#C9572A',
  clay500: '#E2703A',
  clay100: '#FBEDE5',

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

export function buildPineColors(scheme: ColorScheme) {
  const dark = scheme === 'dark';
  return {
    primary: dark ? pinePalette.pine500 : pinePalette.pine600,
    primaryDark: pinePalette.pine700,
    primaryEmphasis: dark ? pinePalette.pine500 : pinePalette.pine900,
    primarySoft: dark ? '#22322A' : pinePalette.pine100,
    primaryTint: dark ? '#1C2922' : pinePalette.pine50,

    accent: pinePalette.clay500,
    accentDark: pinePalette.clay600,
    accentSoft: dark ? '#33251A' : pinePalette.clay100,

    background: dark ? '#1B2320' : pinePalette.paper,
    surface: dark ? '#242E29' : pinePalette.white,
    surfaceAlt: dark ? '#2C3730' : pinePalette.mist100,
    border: dark ? '#3C4A41' : pinePalette.mist200,
    overlay: dark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(15, 44, 34, 0.55)',

    text: dark ? '#EDF2EE' : pinePalette.ink,
    textSecondary: dark ? '#BAC5BE' : pinePalette.slate500,
    textMuted: dark ? '#8CA396' : pinePalette.slate400,
    textInverse: pinePalette.white,

    success: pinePalette.pine500,
    danger: pinePalette.red500,
    dangerSoft: dark ? '#332020' : pinePalette.red100,
    warning: pinePalette.amber500,
    warningSoft: dark ? '#332B1C' : pinePalette.amber100,
    info: pinePalette.blue500,
    infoSoft: dark ? '#1E2A34' : pinePalette.blue100,

    checkpoint: {
      HISTORICAL: { main: pinePalette.purple600, soft: dark ? '#2C2640' : '#EFE9F7' },
      DANGER: { main: pinePalette.red500, soft: dark ? '#332020' : pinePalette.red100 },
      UPCOMING: { main: pinePalette.blue500, soft: dark ? '#1E2A34' : pinePalette.blue100 },
      INFO: { main: pinePalette.teal600, soft: dark ? '#1B2E28' : pinePalette.teal100 },
    },
    tip: {
      WARNING: { main: pinePalette.red500, soft: dark ? '#332020' : pinePalette.red100 },
      ADVICE: { main: pinePalette.teal600, soft: dark ? '#1B2E28' : pinePalette.teal100 },
    },
    difficulty: {
      EASY: { main: pinePalette.pine500, soft: dark ? '#22322A' : pinePalette.pine100 },
      MODERATE: { main: pinePalette.amber500, soft: dark ? '#332B1C' : pinePalette.amber100 },
      HARD: { main: pinePalette.red500, soft: dark ? '#332020' : pinePalette.red100 },
    },
  };
}

// ---------------------------------------------------------------------
// Terra ('v2') — editorial AllTrails/Airbnb-style: neutral true-white
// surfaces, near-black ink, a single deep forest accent, no green cast on
// grays, and a neutral (not green) dark mode.
// ---------------------------------------------------------------------

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

  night900: '#151715',
  night800: '#1E211E',
  night700: '#262A26',
  night600: '#363A36',
} as const;

/** Terra shares Pine's severity sub-palettes (checkpoint/tip/difficulty)
 *  so map markers and badges keep their recognizable meaning; everything
 *  chrome-level goes neutral. */
export function buildTerraColors(scheme: ColorScheme) {
  const dark = scheme === 'dark';
  const base = buildPineColors(scheme);
  return {
    ...base,

    primary: dark ? terra.forest500 : terra.forest600,
    primaryDark: terra.forest700,
    primaryEmphasis: dark ? terra.forest200 : terra.forest700,
    primarySoft: dark ? '#24312A' : terra.forest100,
    primaryTint: dark ? '#1D2620' : terra.forest50,

    accent: pinePalette.clay500,
    accentDark: pinePalette.clay600,
    accentSoft: dark ? '#33251A' : pinePalette.clay100,

    background: dark ? terra.night900 : terra.paper,
    surface: dark ? terra.night800 : pinePalette.white,
    surfaceAlt: dark ? terra.night700 : terra.gray100,
    border: dark ? terra.night600 : terra.gray200,
    overlay: dark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(20, 22, 20, 0.5)',

    text: dark ? '#F2F3F0' : terra.ink,
    textSecondary: dark ? '#B5B8B2' : terra.gray600,
    textMuted: dark ? '#878A84' : terra.gray400,

    success: terra.forest500,
  };
}

// ---------------------------------------------------------------------
// Typography — Pine ('v1') and Terra ('v2') type scales.
// ---------------------------------------------------------------------

const fontFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });
const fontFamilyMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

type Variant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'callout'
  | 'label'
  | 'caption'
  | 'overline';

export const typographyPine: Record<Variant, TextStyle> = {
  display: { fontFamily: fontFamilyMedium, fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: 0.2 },
  title: { fontFamily: fontFamilyMedium, fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: 0.2 },
  heading: { fontFamily: fontFamilyMedium, fontSize: 20, lineHeight: 26, fontWeight: '700' },
  subheading: { fontFamily: fontFamilyMedium, fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontFamily, fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontFamily: fontFamilyMedium, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  callout: { fontFamily, fontSize: 14, lineHeight: 20, fontWeight: '400' },
  label: { fontFamily: fontFamilyMedium, fontSize: 13, lineHeight: 16, fontWeight: '600', letterSpacing: 0.2 },
  caption: { fontFamily, fontSize: 12, lineHeight: 16, fontWeight: '400' },
  overline: {
    fontFamily: fontFamilyMedium,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
};

/** Editorial: bigger, tighter headlines with negative tracking, a 16pt
 *  reading body, and a quieter overline. */
export const typographyTerra: Record<Variant, TextStyle> = {
  display: { fontFamily: fontFamilyMedium, fontSize: 36, lineHeight: 42, fontWeight: '700', letterSpacing: -0.6 },
  title: { fontFamily: fontFamilyMedium, fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.4 },
  heading: { fontFamily: fontFamilyMedium, fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.3 },
  subheading: { fontFamily: fontFamilyMedium, fontSize: 17, lineHeight: 23, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontFamily, fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontFamily: fontFamilyMedium, fontSize: 16, lineHeight: 24, fontWeight: '600' },
  callout: { fontFamily, fontSize: 14, lineHeight: 20, fontWeight: '400' },
  label: { fontFamily: fontFamilyMedium, fontSize: 13, lineHeight: 17, fontWeight: '600' },
  caption: { fontFamily, fontSize: 12, lineHeight: 16, fontWeight: '400' },
  overline: {
    fontFamily: fontFamilyMedium,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
};
