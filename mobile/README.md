# TrailQuest — Mobile App

Bare React Native (CLI, **not Expo**) app for guided hiking-route navigation:
map exploration, route detail, live GPS navigation with on-device checkpoint
geo-triggers + background tracking, and a per-route forum.

**Stack:** React Native 0.86 · TypeScript (strict) · `@rnmapbox/maps` ·
`react-native-background-geolocation` · React Navigation · Zustand ·
React Query · `@notifee/react-native` · `react-native-keychain` ·
`react-native-reanimated` 4.x (+ `react-native-worklets`).

> **Verified:** `tsc --noEmit` clean, Jest unit tests pass, and Metro
> successfully bundles the full dependency graph for both `android` and `ios`
> platforms (`react-native start`, then fetched `index.bundle?platform=...`).
> Note: `react-native-reanimated@3.x` is **not** compatible with RN 0.86 (it
> references a legacy renderer shim that RN 0.86 removed) — this project pins
> `react-native-reanimated@^4.5.0` + `react-native-worklets@^0.10.0`, which
> officially support RN 0.83–0.86. Don't downgrade reanimated to 3.x.

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

## 7. Background geolocation setup

`react-native-background-geolocation` (Transistor Software) powers background
tracking and is autolinked, but it pulls native artifacts from extra Maven
repos. If the Android build can't resolve it, add these inside the
`allprojects { repositories { … } }` block in `android/build.gradle`:

```gradle
maven { url("${project(':react-native-background-geolocation').projectDir}/libs") }
maven { url 'https://developer.huawei.com/repo/' }
maven { url("${project(':react-native-background-fetch').projectDir}/libs") }
```

Follow the vendor's current install guide for any version-specific steps:
https://github.com/transistorsoft/react-native-background-geolocation/blob/master/help/INSTALL-AUTO.md

> **Licensing:** the plugin is free in **debug** builds. A paid licence key is
> required for **release** builds. This is fine for development of this MVP.

## 8. Notifications

`@notifee/react-native` is autolinked (no manual native setup needed). The app
creates a high-importance "Checkpoint Alerts" channel on Android and requests
notification permission as part of the navigation permission flow. Checkpoint
alerts fire locally even when the app is backgrounded.

## 9. Project structure

```
src/
├── api/            # axios client (+ token refresh), per-resource modules, react-query hooks
├── components/     # ui/ primitives + domain components (RouteCard, TipCard, CheckpointModal, map/, forum/)
├── config/         # env (typed @env access)
├── navigation/     # root / auth / tabs / per-tab stacks
├── screens/        # Auth, Explore, RouteDetail, ActiveNavigation, Forum, Profile
├── services/       # keychain, geolocation, notifications, permissions, mapbox
├── store/          # zustand auth/session store
├── theme/          # colors, typography, spacing, icons (design system)
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
  owns permissions, background tracking, Haversine checkpoint triggers, live
  stat derivation (smoothed speed, distance, progress, ETA), and batched
  syncing of the GPS path log to the backend.

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

## Out of scope (this build)

AR / camera overlays, QR scanning, an admin panel UI, forum moderation, and
offline Mapbox tiles (a `TODO` marker for offline tiles lives where Route Detail
would trigger a regional download).
