// Bump this alongside `versionCode`/`versionName` in mobile/android/app/build.gradle
// and mobile/src/config/appVersion.ts whenever a new release APK is published.
export const appVersion = {
  latestVersionCode: 27,
  latestVersionName: '2.16',
  // Must be the asset's actual uploaded filename, not its display "label" —
  // GitHub's label-based /download/<tag>/<label> alias 404s intermittently
  // (confirmed: HEAD redirects fine, a real GET 404s) while the raw filename
  // is reliable. arm64-v8a is the modern-phone build (see the ABI `splits`
  // block in android/app/build.gradle); the in-app update banner sends
  // everyone here since ~99% of real devices are arm64.
  downloadUrl:
    'https://github.com/exRonas/trailquest/releases/latest/download/app-arm64-v8a-release.apk',
  notes: 'Push notifications for friend requests. Minor fixes.',
};
