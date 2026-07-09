import { DesignVersion } from './colors';

/**
 * TrailQuest used to let the user switch between three design languages
 * (Pine/Terra/Atlas — see ./archive/legacyDesigns.ts). Atlas won and the
 * switcher was removed from Settings, but `useDesignVersion()` is kept as a
 * fixed hook so the many components that branch on
 * `useDesignVersion() === 'v3'` for Atlas-specific decor keep working
 * unchanged — they just always take that branch now.
 */
export function useDesignVersion(): DesignVersion {
  return 'v3';
}
