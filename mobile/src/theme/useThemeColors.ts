import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { parseAvatarId } from '../components/avatars';
import { AppColors, colorSets } from './colors';
import { useThemeStore } from './themeStore';
import { useDesignStore } from './designStore';
import { shadeSet, BrandShades } from './shade';

export type ThemeColors = Omit<AppColors, keyof BrandShades> & BrandShades;

/**
 * The active color set (light/dark, resolved from the theme mode + OS scheme)
 * with the primary/brand shades swapped for the current user's avatar accent
 * (falls back to the static pine brand when there's no user or a legacy/initials
 * avatar). Components that render themed UI should read from this hook instead
 * of importing `colors` directly so they re-render when the theme or avatar
 * color changes.
 */
export function useThemeColors(): ThemeColors {
  const os = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const design = useDesignStore((s) => s.version);
  const avatarId = useAuthStore((s) => s.user?.avatar ?? null);
  return useMemo(() => {
    const dark = mode === 'system' ? os === 'dark' : mode === 'dark';
    const base = colorSets[design][dark ? 'dark' : 'light'];
    const spec = parseAvatarId(avatarId);
    if (!spec) return base;
    return { ...base, ...shadeSet(spec.fg, dark) };
  }, [os, mode, design, avatarId]);
}

/** True when the resolved theme is dark (for StatusBar / nav theme wiring). */
export function useIsDark(): boolean {
  const os = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  return mode === 'system' ? os === 'dark' : mode === 'dark';
}
