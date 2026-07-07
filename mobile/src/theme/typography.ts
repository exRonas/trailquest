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

export const typography: Record<Variant, TextStyle> = {
  display: {
    fontFamily: fontFamilyMedium,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  title: {
    fontFamily: fontFamilyMedium,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  heading: {
    fontFamily: fontFamilyMedium,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  subheading: {
    fontFamily: fontFamilyMedium,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  },
  body: {
    fontFamily,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  bodyStrong: {
    fontFamily: fontFamilyMedium,
    fontSize: 15,
    lineHeight: 22,
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
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
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
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
};

export type TypographyVariant = Variant;
