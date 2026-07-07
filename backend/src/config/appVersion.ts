// Bump this alongside `versionCode`/`versionName` in mobile/android/app/build.gradle
// and mobile/src/config/appVersion.ts whenever a new release APK is published.
export const appVersion = {
  latestVersionCode: 3,
  latestVersionName: '1.2',
  downloadUrl:
    'https://github.com/exRonas/trailquest/releases/latest/download/TrailQuest.apk',
  notes: 'Fix: Explore location fetch could time out indoors and never show nearby routes.',
};
