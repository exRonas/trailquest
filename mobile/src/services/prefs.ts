import * as Keychain from 'react-native-keychain';

/**
 * Small persisted key/value store for non-secret user preferences (currently the
 * UI language). Reuses the already-linked Keychain module under its own service
 * name so we don't need an extra native dependency just for one string.
 */

const PREFS_SERVICE = 'com.trailquest.prefs';

export async function savePref(key: string, value: string): Promise<void> {
  try {
    const all = await loadAll();
    all[key] = value;
    await Keychain.setGenericPassword('trailquest', JSON.stringify(all), {
      service: PREFS_SERVICE,
    });
  } catch {
    // Best-effort: a failed write just means the pref won't persist.
  }
}

export async function loadPref(key: string): Promise<string | null> {
  const all = await loadAll();
  return all[key] ?? null;
}

async function loadAll(): Promise<Record<string, string>> {
  try {
    const creds = await Keychain.getGenericPassword({ service: PREFS_SERVICE });
    if (!creds) return {};
    return JSON.parse(creds.password) as Record<string, string>;
  } catch {
    return {};
  }
}
