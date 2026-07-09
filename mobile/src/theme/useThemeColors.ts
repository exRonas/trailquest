import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { AppColors, colorSets } from './colors';
import { useThemeStore } from './themeStore';
import { useDesignStore } from './designStore';
import { BrandShades } from './shade';

export type ThemeColors = Omit<AppColors, keyof BrandShades> & BrandShades;

/**
 * The active color set, resolved from the design (Pine/Terra/Atlas) and the
 * theme mode + OS scheme. Components that render themed UI should read from
 * this hook instead of importing `colors` directly so they re-render when the
 * theme changes.
 *
 * Avatars no longer recolor the app — that per-user accent (driven by the
 * avatar's chosen color) was confusing (changing your avatar silently
 * reskinned every screen) and broke Atlas's art-directed palette outright, so
 * the color choice was dropped from the avatar picker in favor of avatars
 * just using the current theme accent. See AvatarPicker.tsx.
 */
export function useThemeColors(): ThemeColors {
  const os = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const design = useDesignStore((s) => s.version);
  return useMemo(() => {
    const dark = mode === 'system' ? os === 'dark' : mode === 'dark';
    return colorSets[design][dark ? 'dark' : 'light'];
  }, [os, mode, design]);
}

/** True when the resolved theme is dark (for StatusBar / nav theme wiring). */
export function useIsDark(): boolean {
  const os = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  return mode === 'system' ? os === 'dark' : mode === 'dark';
}
