import notifee, {
  AndroidImportance,
  AuthorizationStatus,
} from '@notifee/react-native';
import { Checkpoint } from '../types/api';
import { labelForCheckpointType } from '../utils/format';
import { pickLocalized, useLocaleStore } from '../i18n';

/**
 * Local notifications for checkpoint triggers. These fire even when the app is
 * backgrounded (paired with background geolocation), so a hiker is alerted when
 * they enter a checkpoint radius without staring at the screen.
 */

const CHECKPOINT_CHANNEL_ID = 'checkpoint-alerts';
let channelReady = false;

export async function ensureNotificationChannel(): Promise<void> {
  if (channelReady) return;
  await notifee.createChannel({
    id: CHECKPOINT_CHANNEL_ID,
    name: 'Checkpoint Alerts',
    description: 'Fires when you reach a checkpoint on a route',
    importance: AndroidImportance.HIGH,
    vibration: true,
  });
  channelReady = true;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}

export async function getNotificationPermissionGranted(): Promise<boolean> {
  const settings = await notifee.getNotificationSettings();
  return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
}

export async function notifyCheckpointReached(
  checkpoint: Checkpoint,
): Promise<void> {
  await ensureNotificationChannel();
  const lang = useLocaleStore.getState().language;
  const name = pickLocalized(checkpoint.name, lang);
  const description = pickLocalized(checkpoint.description, lang);
  await notifee.displayNotification({
    title: `📍 ${name}`,
    body:
      checkpoint.type === 'DANGER'
        ? `⚠️ ${description}`
        : `${labelForCheckpointType(checkpoint.type)} · ${description}`,
    android: {
      channelId: CHECKPOINT_CHANNEL_ID,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
      importance: AndroidImportance.HIGH,
    },
    ios: {
      sound: 'default',
    },
  });
}
