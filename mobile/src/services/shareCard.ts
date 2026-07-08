import { RefObject } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import Share from 'react-native-share';

/**
 * Capture an off-screen view (see ShareableStatsCard) to a PNG and open the
 * system share sheet with it as an image plus an optional caption. Silently
 * ignores the user dismissing the sheet; rethrows real capture/share errors so
 * the caller can surface them.
 */
export async function shareViewAsImage(
  ref: RefObject<View | null>,
  message?: string,
): Promise<void> {
  if (!ref.current) return;
  const uri = await captureRef(ref, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });
  try {
    await Share.open({
      url: uri,
      type: 'image/png',
      message,
      failOnCancel: false,
    });
  } catch (err) {
    // react-native-share throws on user-cancel even with failOnCancel:false on
    // some platforms — treat a dismissal as a no-op.
    const msg = err instanceof Error ? err.message : String(err);
    if (/cancel/i.test(msg)) return;
    throw err;
  }
}
