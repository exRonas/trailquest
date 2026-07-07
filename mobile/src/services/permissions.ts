import { requestLocationPermission, LocationAuth } from './geolocation';
import {
  requestNotificationPermission,
  getNotificationPermissionGranted,
} from './notifications';

export type { LocationAuth };

export interface NavigationPermissions {
  location: LocationAuth;
  notifications: boolean;
}

/**
 * Request everything the Active Navigation experience needs. Location is the
 * hard requirement; notifications are best-effort (checkpoint alerts while
 * backgrounded) and shouldn't block the hike if declined.
 */
export async function requestNavigationPermissions(): Promise<NavigationPermissions> {
  const location = await requestLocationPermission();
  const notifications = await requestNotificationPermission();
  return { location, notifications };
}

export async function getNotificationStatus(): Promise<boolean> {
  return getNotificationPermissionGranted();
}
