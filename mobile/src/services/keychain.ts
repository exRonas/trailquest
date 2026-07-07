import * as Keychain from 'react-native-keychain';

/**
 * Secure persistence of the JWT pair using the platform Keychain (iOS) /
 * Keystore-backed EncryptedSharedPreferences (Android). Tokens are stored as a
 * JSON blob under a dedicated service name.
 */

const TOKEN_SERVICE = 'com.trailquest.tokens';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await Keychain.setGenericPassword('trailquest', JSON.stringify(tokens), {
    service: TOKEN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function loadTokens(): Promise<StoredTokens | null> {
  try {
    const creds = await Keychain.getGenericPassword({ service: TOKEN_SERVICE });
    if (!creds) return null;
    const parsed = JSON.parse(creds.password) as StoredTokens;
    if (!parsed.accessToken || !parsed.refreshToken) return null;
    return parsed;
  } catch {
    // Corrupt / unreadable entry — treat as signed out.
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
}
