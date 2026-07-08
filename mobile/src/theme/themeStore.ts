import { create } from 'zustand';
import { Appearance } from 'react-native';
import { loadPref, savePref } from '../services/prefs';
import { applyColorScheme, ColorScheme } from './colors';

/** 'system' follows the OS setting; 'light'/'dark' force it. */
export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_KEY = 'themeMode';

function osScheme(): ColorScheme {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

/** Resolve a mode into a concrete light/dark scheme. */
export function resolveScheme(mode: ThemeMode): ColorScheme {
  return mode === 'system' ? osScheme() : mode;
}

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  setMode: (mode) => {
    set({ mode });
    applyColorScheme(resolveScheme(mode));
    void savePref(THEME_KEY, mode);
  },
  hydrate: async () => {
    const saved = (await loadPref(THEME_KEY)) as ThemeMode | null;
    const mode: ThemeMode =
      saved === 'light' || saved === 'dark' || saved === 'system'
        ? saved
        : 'system';
    set({ mode });
    applyColorScheme(resolveScheme(mode));
  },
}));

export const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark'];
