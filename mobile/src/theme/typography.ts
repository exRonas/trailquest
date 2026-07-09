import { Platform, TextStyle } from 'react-native';

/**
 * A single type scale used across the app. We rely on the platform system font
 * (San Francisco / Roboto) but commit to a consistent scale and weights so the
 * UI reads as intentional rather than default.
 */

export const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const fontFamilyMedium = Platform.select({
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

/** Serif family for Atlas display type — Noto Serif on Android, New York-ish
 *  Georgia fallback elsewhere. System-provided, no font files to bundle. */
export const fontFamilySerif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia',
});

/** Atlas ('v3') scale — vintage field-guide: serif headlines, roomy body,
 *  wide-tracked expedition-poster overlines. */
const typographyV3: Record<Variant, TextStyle> = {
  display: {
    fontFamily: fontFamilySerif,
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: 0,
  },
  title: {
    fontFamily: fontFamilySerif,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: 0,
  },
  heading: {
    fontFamily: fontFamilySerif,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '700',
  },
  subheading: {
    fontFamily: fontFamilyMedium,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '600',
  },
  body: {
    fontFamily,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
  },
  bodyStrong: {
    fontFamily: fontFamilyMedium,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
  },
  callout: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  label: {
    fontFamily: fontFamilyMedium,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  caption: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  overline: {
    fontFamily: fontFamilyMedium,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
};

/** The live type scale — Atlas's, the only one now (Pine/Terra's retired
 *  scales are archived in ./archive/legacyDesigns.ts). AppText spreads
 *  `typography[variant]` on every render. */
export const typography: Record<Variant, TextStyle> = typographyV3;

export type TypographyVariant = Variant;
