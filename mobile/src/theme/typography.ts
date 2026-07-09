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

const typographyV1: Record<Variant, TextStyle> = {
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

/** Terra ('v2') scale — editorial, AllTrails/Airbnb-style: bigger, tighter
 *  headlines with negative tracking, a 16pt reading body, and a quieter
 *  overline (the shouty wide-tracked caps read as template-y). */
const typographyV2: Record<Variant, TextStyle> = {
  display: {
    fontFamily: fontFamilyMedium,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  title: {
    fontFamily: fontFamilyMedium,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  heading: {
    fontFamily: fontFamilyMedium,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subheading: {
    fontFamily: fontFamilyMedium,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  body: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyStrong: {
    fontFamily: fontFamilyMedium,
    fontSize: 16,
    lineHeight: 24,
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
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
};

const typographySets = { v1: typographyV1, v2: typographyV2 } as const;

/** The live type scale. AppText spreads `typography[variant]` on every render,
 *  so mutating these objects in place (applyDesignTypography) restyles all
 *  hook-rendered text immediately — same contract as the mutable `colors`. */
export const typography: Record<Variant, TextStyle> = {
  display: { ...typographyV1.display },
  title: { ...typographyV1.title },
  heading: { ...typographyV1.heading },
  subheading: { ...typographyV1.subheading },
  body: { ...typographyV1.body },
  bodyStrong: { ...typographyV1.bodyStrong },
  callout: { ...typographyV1.callout },
  label: { ...typographyV1.label },
  caption: { ...typographyV1.caption },
  overline: { ...typographyV1.overline },
};

export function applyDesignTypography(design: 'v1' | 'v2'): void {
  const source = typographySets[design];
  (Object.keys(typography) as Variant[]).forEach((variant) => {
    const target = typography[variant] as Record<string, unknown>;
    // Clear first: variants differ in which keys they set (e.g. v1 title has
    // letterSpacing 0.2, v2 label has none) — a plain assign would leave
    // stale properties behind.
    Object.keys(target).forEach((key) => delete target[key]);
    Object.assign(target, source[variant]);
  });
}

export type TypographyVariant = Variant;
