import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { registerPushTokenRequest } from '../api/push.api';
import { requestNotificationPermission } from './notifications';

const GENERAL_CHANNEL_ID = 'general-alerts';
let channelReady = false;
let listenersReady = false;

async function ensureGeneralChannel(): Promise<void> {
  if (channelReady) return;
  await notifee.createChannel({
    id: GENERAL_CHANNEL_ID,
    name: 'General',
    description: 'Friend requests, achievements, and other app alerts',
    importance: AndroidImportance.DEFAULT,
  });
  channelReady = true;
}

/** RN Firebase's `onMessage` only fires while the app is in the foreground
 *  — Android auto-displays the system notification for background/killed
 *  states on its own since our pushes always carry a `notification` block.
 *  Foreground messages need to be shown manually or they're silently
 *  dropped (the whole point of foreground being "suppress the tray"). */
function wireForegroundHandler(): void {
  if (listenersReady) return;
  listenersReady = true;

  messaging().onMessage(async (remoteMessage) => {
    if (!remoteMessage.notification) return;
    await ensureGeneralChannel();
    await notifee.displayNotification({
      title: remoteMessage.notification.title,
      body: remoteMessage.notification.body,
      data: remoteMessage.data,
      android: {
        channelId: GENERAL_CHANNEL_ID,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
        importance: AndroidImportance.DEFAULT,
      },
    });
  });

  messaging().onTokenRefresh((token) => {
    void registerPushTokenRequest(token, 'android');
  });
}

/** Requests notification permission (Android 13+), fetches the FCM token,
 *  and registers it with the backend. Safe to call every time the user
 *  signs in — a re-registration is just an upsert on the server. Never
 *  throws: push is a nice-to-have, not something that should block sign-in
 *  if permission is denied or FCM is unreachable. */
export async function registerPushNotifications(): Promise<void> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    const token = await messaging().getToken();
    await registerPushTokenRequest(token, 'android');
    wireForegroundHandler();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[pushNotifications] setup failed:', err);
  }
}
