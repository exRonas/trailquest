import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/api';

/**
 * Last-known user profile, cached alongside the auth tokens so opening the
 * app with no signal can still land you in the app as yourself instead of
 * bouncing to the login screen (see authStore.hydrate — fetchMe() failing
 * purely from no connection must not look like an invalid session).
 */

const CACHE_KEY = 'tq_cached_user_v1';

export async function saveCachedUser(user: User): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(user));
}

export async function loadCachedUser(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export async function clearCachedUser(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}
