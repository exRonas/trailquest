import { create } from 'zustand';
import { loadPref, savePref } from '../services/prefs';
import { applyDesign, DesignVersion } from './colors';
import { applyDesignTypography } from './typography';
import { resolveScheme, useThemeStore } from './themeStore';

/**
 * Which of the two design languages is active — 'v1' "Pine" (original) or
 * 'v2' "Terra" (editorial AllTrails/Airbnb-style). Both live in the codebase
 * so they can be compared in-app and either can ship; see colors.ts.
 */

const DESIGN_KEY = 'designVersion';

function apply(version: DesignVersion): void {
  applyDesign(version, resolveScheme(useThemeStore.getState().mode));
  applyDesignTypography(version);
}

interface DesignState {
  version: DesignVersion;
  setVersion: (version: DesignVersion) => void;
  hydrate: () => Promise<void>;
}

export const useDesignStore = create<DesignState>((set) => ({
  version: 'v1',
  setVersion: (version) => {
    set({ version });
    apply(version);
    void savePref(DESIGN_KEY, version);
  },
  hydrate: async () => {
    const saved = await loadPref(DESIGN_KEY);
    const version: DesignVersion = saved === 'v2' ? 'v2' : 'v1';
    set({ version });
    apply(version);
  },
}));

export const DESIGN_VERSIONS: DesignVersion[] = ['v1', 'v2'];

/** Convenience selector for components that only need the active version. */
export function useDesignVersion(): DesignVersion {
  return useDesignStore((s) => s.version);
}
