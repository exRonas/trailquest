// Bump this alongside `versionCode`/`versionName` in mobile/android/app/build.gradle
// and mobile/src/config/appVersion.ts whenever a new release APK is published.
export const appVersion = {
  latestVersionCode: 21,
  latestVersionName: '2.10',
  downloadUrl:
    'https://github.com/exRonas/trailquest/releases/latest/download/TrailQuest.apk',
  notes:
    'Fixed: saving in Settings could freeze every button on the Profile screen (a stuck touch responder from closing the keyboard mid-navigation) — this was the real cause behind Profile buttons going dead after changing your name.',
};
