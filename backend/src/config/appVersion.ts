// Bump this alongside `versionCode`/`versionName` in mobile/android/app/build.gradle
// and mobile/src/config/appVersion.ts whenever a new release APK is published.
export const appVersion = {
  latestVersionCode: 20,
  latestVersionName: '2.9',
  downloadUrl:
    'https://github.com/exRonas/trailquest/releases/latest/download/TrailQuest.apk',
  notes:
    'Fixed: manually switching to Light/Dark theme left many screens half-themed (screen backgrounds and cards were frozen at the color scheme the app booted in). Every screen now switches fully.',
};
