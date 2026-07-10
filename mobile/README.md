# TrailQuest — Mobile App

Bare React Native (CLI, **not Expo**) app for guided hiking-route navigation:
map exploration, route detail, live GPS navigation with **QR-scan
checkpoints** (XP/levels/ranks per country), offline-first progress
(start/scan/complete queue and sync), and a per-route forum. Single in-house
design language ("Atlas" — expedition/archive style, custom SVG decor),
dark/light/system theming, RU/EN/KK throughout.

**Stack:** React Native 0.86 · TypeScript (strict) · `@rnmapbox/maps` ·
`@react-native-community/geolocation` · `react-native-camera-kit` (QR
scanning) · React Navigation · Zustand · React Query ·
`@notifee/react-native` · `react-native-keychain` ·
`@react-native-async-storage/async-storage` ·
`react-native-reanimated` 4.x (+ `react-native-worklets`) ·
`react-native-gesture-handler` · `react-native-svg` ·
`react-native-view-shot` + `react-native-share`.

> **Verified:** `tsc --noEmit` clean, Jest unit tests pass, and Metro
> successfully bundles the full dependency graph for both `android` and `ios`
> platforms (`react-native start`, then fetched `index.bundle?platform=...`).
> Note: `react-native-reanimated@3.x` is **not** compatible with RN 0.86 (it
> references a legacy renderer shim that RN 0.86 removed) — this project pins
> `react-native-reanimated@^4.5.0` + `react-native-worklets@^0.10.0`, which
> officially support RN 0.83–0.86. Don't downgrade reanimated to 3.x.
>
> Location tracking previously used the commercial
> `react-native-background-geolocation` plugin, which refuses to track in
> **release** builds without a paid license — replaced with the free
> `@react-native-community/geolocation` (see
> [`../docs/ADMIN_WEB_PROGRESS.md`](../docs/ADMIN_WEB_PROGRESS.md) Round 6).
> Tracking is foreground-only (screen on) via a foreground service; reliable
> screen-off background tracking is deferred.

---

## 1. Prerequisites

- **Node.js** ≥ 22.11
- **JDK 17** and **Android Studio** (SDK + an emulator or a device) for Android
- **Xcode 15+**, **CocoaPods**, and a Mac for iOS
- A **Mapbox account** (free): https://account.mapbox.com
- The **backend running** (see `../backend/README.md`)

This project follows the standard RN environment setup:
https://reactnative.dev/docs/set-up-your-environment

## 2. Install

```bash
cd mobile
npm install
# iOS only:
cd ios && bundle install && bundle exec pod install && cd ..
```

## 3. Configure environment (`.env`)

```bash
cp .env.example .env
```

Then edit `.env`:

| Variable              | Notes                                                        |
|-----------------------|-------------------------------------------------------------|
| `API_URL`             | Backend base URL. Android emulator: `http://10.0.2.2:4000/api`. iOS sim: `http://localhost:4000/api`. Physical device: your machine's LAN IP. |
| `MAPBOX_PUBLIC_TOKEN` | Your Mapbox **public** token (`pk.…`). Used by the JS SDK at runtime. |
| `MAPBOX_STYLE_URL`    | Optional custom style. Defaults to `mapbox://styles/mapbox/outdoors-v12`. |

> The app **runs without a Mapbox token** — map views show a documented
> placeholder and the rest of the app (lists, detail, forum, profile) works
> fully. Add the token to enable maps.

## 4. Mapbox native SDK download token

Separate from the public runtime token, the **native** Mapbox SDK is fetched at
build time from a credentialed Maven/CocoaPods repo using a **secret** token
(`sk.…`) with the `Downloads:Read` scope. Create it in the Mapbox dashboard.

**Android** — add to `~/.gradle/gradle.properties` (global, not committed):

```properties
MAPBOX_DOWNLOADS_TOKEN=sk.your_secret_download_token
```

(The repo block that consumes it is already wired in `android/build.gradle`.)

**iOS** — add to `~/.netrc`:

```
machine api.mapbox.com
login mapbox
password sk.your_secret_download_token
```

## 5. Run

```bash
# Start Metro
npm start

# Android (emulator/device connected)
npm run android

# iOS
npm run ios
```

## 6. What's already configured natively

These edits ship in the repo so you don't have to make them:

- **Android permissions** (`AndroidManifest.xml`): fine/coarse/background
  location, foreground service (+ location), wake lock, post-notifications.
- **iOS** (`Info.plist`): location usage strings (when-in-use + always),
  motion usage, `UIBackgroundModes` (location/fetch/processing), and the
  MaterialCommunityIcons font under `UIAppFonts`.
- **Mapbox download repo** wired in `android/build.gradle`.
- **Vector icon fonts** bundled via `fonts.gradle` in `android/app/build.gradle`.
- **Gesture handler** imported first in `index.js`; **reanimated** babel plugin
  in `babel.config.js`.

## 7. Location & QR scanning setup

`@react-native-community/geolocation` (free, TurboModule) powers positioning
— used for live-navigation stats and the "nearby routes" bucket on Explore,
requested via `PermissionsAndroid` (`FINE_LOCATION` → `whenInUse`). No paid
license, no extra Maven repos needed (unlike the earlier
`react-native-background-geolocation`, dropped for exactly this reason — see
[`../docs/ADMIN_WEB_PROGRESS.md`](../docs/ADMIN_WEB_PROGRESS.md) Round 6).

`react-native-camera-kit` powers the checkpoint **QR scanner**
(`QRScannerModal.tsx`) — a single native module, new-arch OK, needs the
`CAMERA` permission (already in the Android manifest).

## 8. Notifications

`@notifee/react-native` is autolinked (no manual native setup needed). The app
creates a high-importance "Checkpoint Alerts" channel on Android and requests
notification permission as part of the navigation permission flow. Checkpoint
alerts fire locally even when the app is backgrounded.

## 9. Project structure

```
src/
├── api/            # axios client (+ token refresh), per-resource modules, react-query hooks
├── components/     # ui/ primitives + decor/ (Atlas SVG art) + domain components (RouteCard, TipCard, CheckpointModal, map/, forum/, avatars)
├── config/         # env (typed @env access), appVersion (update-banner comparison)
├── navigation/     # root / auth / tabs / per-tab stacks
├── screens/        # Auth, Explore, RouteDetail, ActiveNavigation, Forum, Profile (+ Friends, Leaderboard, Achievements, UserProfile)
├── services/       # keychain, geolocation, notifications, permissions, mapbox, offlineMaps, offlineQueue, routesCache, shareCard
├── store/          # zustand auth/session/theme stores
├── theme/          # colors (Atlas), typography, spacing, icons, archive/legacyDesigns.ts (retired Pine/Terra)
├── types/          # api + navigation types, @env decl
└── utils/          # geo (Haversine, speed, progress), formatters, validation
```

### Key architecture decisions

- **Auth/session** → Zustand (`store/authStore`). Tokens persist in the
  Keychain/Keystore; `hydrate()` auto-logs-in on launch and validates via
  `/auth/me` (transparently refreshing an expired access token).
- **Server data** → React Query, with optimistic updates on creating forum
  posts and comments.
- **Navigation engine** (`screens/ActiveNavigation/useNavigationEngine.ts`)
  owns permissions, foreground tracking, **QR-scan checkpoint marking**
  (not GPS proximity), live stat derivation (smoothed speed, distance,
  progress, ETA), and offline-first sync of scans/points/completion via
  `services/offlineQueue.ts` (falls back to a local queue on network
  failure, replays on reconnect).
- **Design** → single design language ("Atlas"); `theme/colors.ts` builds
  light/dark palettes read live via `useThemeColors()`. Pine/Terra were
  earlier switchable alternatives, now archived (not wired into the app).

## 10. Scripts

| Script              | Purpose                          |
|---------------------|----------------------------------|
| `npm start`         | Metro bundler                    |
| `npm run android`   | Build & run on Android           |
| `npm run ios`       | Build & run on iOS               |
| `npm run typecheck` | `tsc --noEmit`                   |
| `npm test`          | Jest unit tests (geo + format)   |
| `npm run lint`      | ESLint                           |

## 11. Demo credentials

The backend seed creates:

| Role  | Email                  | Password      |
|-------|------------------------|---------------|
| User  | `hiker@trailquest.app` | `password123` |
| Admin | `admin@trailquest.app` | `password123` |

## 12. Troubleshooting

- **Map is blank / placeholder** → set `MAPBOX_PUBLIC_TOKEN` in `.env`, then
  restart Metro with `npm start --reset-cache` (`@env` values are inlined at
  build time).
- **Android build fails downloading Mapbox** → check `MAPBOX_DOWNLOADS_TOKEN`
  in `~/.gradle/gradle.properties` (must be an `sk.*` token with Downloads:Read).
- **Network error talking to the API** → verify `API_URL`. Emulators can't reach
  `localhost`; use `10.0.2.2` (Android) or your LAN IP (physical device).
- **Icons show as boxes** → ensure the `fonts.gradle` apply line is present
  (Android) / `MaterialCommunityIcons.ttf` is in `UIAppFonts` and you've
  re-run `pod install` (iOS).
- **`@env` import not found** → restart Metro with `--reset-cache` after editing
  `.env`.

## Out of scope

AR / camera overlays (Phase 2 — data model is AR-ready, unbuilt), push
notifications (needs a Firebase/FCM project), password reset (needs SMTP).
QR checkpoint scanning, offline Mapbox tiles, and the admin panel are all
now built — see
[`../docs/ADMIN_WEB_PROGRESS.md`](../docs/ADMIN_WEB_PROGRESS.md) for the
full round-by-round history.
