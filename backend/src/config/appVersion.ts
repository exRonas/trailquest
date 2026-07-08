// Bump this alongside `versionCode`/`versionName` in mobile/android/app/build.gradle
// and mobile/src/config/appVersion.ts whenever a new release APK is published.
export const appVersion = {
  latestVersionCode: 22,
  latestVersionName: '2.11',
  downloadUrl:
    'https://github.com/exRonas/trailquest/releases/latest/download/TrailQuest.apk',
  notes:
    'Fixed another cause of frozen buttons: a rare RN bug where taps stop registering right after a theme change or closing a screen. Buttons across the app are more robust now.',
};
