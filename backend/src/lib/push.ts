import fs from 'fs';
import path from 'path';
import { initializeApp, cert, App } from 'firebase-admin/app';
import { getMessaging, SendResponse } from 'firebase-admin/messaging';
import { prisma } from './prisma';
import { env } from '../config/env';

let app: App | null | undefined;

/** Lazily initialises the Firebase Admin app. Prefers
 *  `FIREBASE_SERVICE_ACCOUNT_JSON` (the raw JSON as a single env var — the
 *  only option on hosts with no writable/committable filesystem, like
 *  Render) and falls back to `FIREBASE_SERVICE_ACCOUNT_PATH` (a local file,
 *  simplest for dev). Returns null (and logs once) if neither is set — same
 *  "optional feature, no-op if unset" shape as the mailer. */
function getApp(): App | null {
  if (app !== undefined) return app;

  const rawJson = env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    app = initializeApp({ credential: cert(JSON.parse(rawJson)) });
    return app;
  }

  const relPath = env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!relPath) {
    // eslint-disable-next-line no-console
    console.warn(
      '[push] neither FIREBASE_SERVICE_ACCOUNT_JSON nor FIREBASE_SERVICE_ACCOUNT_PATH is set — push disabled',
    );
    app = null;
    return app;
  }
  const absPath = path.isAbsolute(relPath) ? relPath : path.join(process.cwd(), relPath);
  if (!fs.existsSync(absPath)) {
    // eslint-disable-next-line no-console
    console.warn(`[push] service account file not found at ${absPath} — push disabled`);
    app = null;
    return app;
  }

  const serviceAccount = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
  app = initializeApp({ credential: cert(serviceAccount) });
  return app;
}

export interface PushNotification {
  title: string;
  body: string;
  /** Arbitrary string data the app can use to deep-link on tap. */
  data?: Record<string, string>;
}

/** Registers (or refreshes) a device's FCM token for a user. */
export async function registerPushToken(
  userId: string,
  token: string,
  platform = 'android',
): Promise<void> {
  await prisma.pushToken.upsert({
    where: { token },
    create: { userId, token, platform },
    update: { userId, platform },
  });
}

export async function unregisterPushToken(token: string): Promise<void> {
  await prisma.pushToken.deleteMany({ where: { token } });
}

/** Sends a push to every device registered for a user. Dead tokens (the
 *  app was uninstalled, etc — FCM reports these as not-found/unregistered)
 *  are deleted so they stop being retried. Never throws — a failed push
 *  should never break the request that triggered it (e.g. sending a friend
 *  request still succeeds even if the push fails). */
export async function sendPushToUser(
  userId: string,
  notification: PushNotification,
): Promise<void> {
  try {
    const firebase = getApp();
    if (!firebase) return;

    const tokens = await prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });
    if (tokens.length === 0) return;

    const res = await getMessaging(firebase).sendEachForMulticast({
      tokens: tokens.map((t) => t.token),
      notification: { title: notification.title, body: notification.body },
      data: notification.data,
    });

    const deadTokens: string[] = [];
    res.responses.forEach((r: SendResponse, i: number) => {
      if (!r.success) {
        const code = r.error?.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          deadTokens.push(tokens[i].token);
        } else {
          // eslint-disable-next-line no-console
          console.warn('[push] send failed:', code, r.error?.message);
        }
      }
    });
    if (deadTokens.length > 0) {
      await prisma.pushToken.deleteMany({ where: { token: { in: deadTokens } } });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[push] sendPushToUser threw:', err);
  }
}
