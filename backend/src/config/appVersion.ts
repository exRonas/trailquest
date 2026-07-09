// Bump this alongside `versionCode`/`versionName` in mobile/android/app/build.gradle
// and mobile/src/config/appVersion.ts whenever a new release APK is published.
export const appVersion = {
  latestVersionCode: 24,
  latestVersionName: '2.13',
  // Must be the asset's actual uploaded filename, not its display "label" —
  // GitHub's label-based /download/<tag>/<label> alias 404s intermittently
  // (confirmed: HEAD redirects fine, a real GET 404s) while the raw filename
  // is reliable.
  downloadUrl:
    'https://github.com/exRonas/trailquest/releases/latest/download/app-release.apk',
  notes:
    'New "Atlas" design option (Settings > Appearance > Design): a vintage-expedition look with postage-stamp route cards, mountain scenes, and a few playful animations. Also fixes a bug where the Explore routes list could freeze after switching tabs, and cleans up the avatar picker.',
};
