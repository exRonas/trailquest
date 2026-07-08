// Bump this alongside `versionCode`/`versionName` in mobile/android/app/build.gradle
// and mobile/src/config/appVersion.ts whenever a new release APK is published.
export const appVersion = {
  latestVersionCode: 11,
  latestVersionName: '2.0',
  downloadUrl:
    'https://github.com/exRonas/trailquest/releases/latest/download/TrailQuest.apk',
  notes:
    'Fixed: opening the app offline no longer logs you out or hangs — Profile, routes, and finishing a hike all work smoothly with no signal.',
};
