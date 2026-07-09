// Bump this alongside `versionCode`/`versionName` in mobile/android/app/build.gradle
// and mobile/src/config/appVersion.ts whenever a new release APK is published.
export const appVersion = {
  latestVersionCode: 25,
  latestVersionName: '2.14',
  // Must be the asset's actual uploaded filename, not its display "label" —
  // GitHub's label-based /download/<tag>/<label> alias 404s intermittently
  // (confirmed: HEAD redirects fine, a real GET 404s) while the raw filename
  // is reliable.
  downloadUrl:
    'https://github.com/exRonas/trailquest/releases/latest/download/app-release.apk',
  notes:
    'Atlas is now the app\'s one and only look — the design switcher in Settings is gone. Also launches a new landing page (exronas.github.io/trailquest) with a direct download link.',
};
