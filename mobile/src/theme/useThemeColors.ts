import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { parseAvatarId } from '../components/avatars';
import { colors } from './colors';
import { shadeSet, BrandShades } from './shade';

export type ThemeColors = Omit<typeof colors, keyof BrandShades> & BrandShades;

/**
 * `colors` with the primary/brand shades swapped for the current user's
 * avatar accent color (falls back to the static pine brand when there's no
 * user or a legacy/initials avatar). Components that render brand-colored UI
 * should read from this hook instead of importing `colors` directly so they
 * re-render when the avatar color changes.
 */
export function useThemeColors(): ThemeColors {
  const avatarId = useAuthStore((s) => s.user?.avatar ?? null);
  return useMemo(() => {
    const spec = parseAvatarId(avatarId);
    if (!spec) return colors;
    return { ...colors, ...shadeSet(spec.fg) };
  }, [avatarId]);
}
