# Admin Web Panel + Auto Road-Snapping — Progress / Handoff

> Living doc. Update the **Status checklist** and **RESUME HERE** after each work
> chunk so a fresh session can pick up immediately.

## Goal (from user)

1. A **browser admin panel** where an admin can create & edit routes and
   everything attached to them: title/description/category/difficulty/region/
   country, the route path, and checkpoints (name, type, description, radius,
   coordinates) and tips.
2. Fix the **crooked route line**: today a route is drawn as straight segments
   between a handful of waypoints (A→B), not following streets. The user prefers
   this to be **automatic** (snap to roads) rather than hand-drawing every bend.

## Key decisions

- **Web stack:** Vite + React + TypeScript SPA in `admin/`, talking to the
  existing Express REST API. Reuses the same JWT login (admin user). Libraries:
  react-router-dom, @tanstack/react-query, axios, mapbox-gl (+ optional
  @mapbox/mapbox-gl-draw). Mapbox **public token** lives in `admin/.env`
  (`VITE_MAPBOX_TOKEN`). API base in `VITE_API_URL` (default
  `http://localhost:4001/api`).
- **Auto road-snapping approach:** the admin places a few **waypoints**
  (these are the `pathPoints`). On save, the admin calls the **Mapbox Directions
  API** (`/directions/v5/mapbox/walking`) with those waypoints and stores the
  returned road-following geometry in a new `Route.routeGeometry` JSON field
  (array of `{ lat, lng }`). The **mobile app renders `routeGeometry` when
  present**, else falls back to the straight `pathPoints` line. This keeps the
  heavy routing call at edit-time and makes mobile rendering cheap/offline-ok.
- **Admin save is "full upsert":** one request carries the route scalars +
  `pathPoints` + `routeGeometry` + nested `checkpoints[]` + `tips[]`. Backend
  replaces checkpoints/tips transactionally. Tips reference their checkpoint by
  array index (`checkpointIndex`) like the seed does.
- Admin user already seeded: `admin@trailquest.app` / `password123` (role ADMIN).

## Architecture notes (existing app)

- Monorepo: `backend/` (Express+TS+Prisma+Postgres, runs on **:4001**),
  `mobile/` (React Native), now `admin/` (new web).
- Backend admin guards exist: `requireAuth` + `requireAdmin` (Role.ADMIN).
- `Route.pathPoints` JSON = `[{lat,lng,altitudeM?,sequence}]`.
- Mobile draws the line in `mobile/src/components/map/RoutePreviewMap.tsx` and
  `mobile/src/screens/ActiveNavigation/ActiveNavigationScreen.tsx` from
  `pathPoints` sorted by sequence.
- Backend run: `cd backend && npm run dev` (ts-node-dev). Reseed:
  `npx prisma db seed`. After schema change: `npx prisma migrate dev --name X`
  then **stop the dev server before `npx prisma generate`** (Windows file lock).
- Env on this machine: ANDROID_HOME/JAVA_HOME set; Postgres service
  `postgresql-x64-16` running; backend on 4001; `adb reverse` maps 4001+8081.

## Status checklist

- [x] **B1** Backend: add `Route.routeGeometry Json?`; migrate + regenerate client.
      (migration `20260629091305_add_route_geometry`)
- [x] **B2** Backend: route schemas — `fullRouteSchema` accepts `routeGeometry`,
      nested `checkpoints[]`, `tips[]` (+ `checkpointIndex`). `adminCheckpointSchema`,
      `adminTipSchema`, `geoPointSchema` added in `route.schema.ts`.
- [x] **B3** Backend: `route.service` `createRoute`/`replaceRoute` do transactional
      full upsert (wipe+recreate checkpoints/tips). Endpoints: `POST /api/routes`
      (full create), `PUT /api/routes/:id` (full replace), `PATCH` kept for partial,
      `DELETE` existing. All admin-guarded.
- [x] **B4** Backend: `tsc --noEmit` clean; smoke-tested POST(201)/PUT(200)/
      DELETE(204)→GET(404) with nested checkpoints+tips+geometry. ✓
- [x] **M1** Mobile: `RouteDetail.routeGeometry` typed; `RoutePreviewMap` takes
      optional `geometry` prop and prefers it; `ActiveNavigationScreen` line prefers
      geometry; RouteDetailScreen passes `geometry={data.routeGeometry}`. tsc clean.
      NOTE: existing seeded routes have null geometry → still straight until
      re-saved via admin or backfilled (see X1).
- [x] **W1** Web: Vite React TS scaffolded in `admin/`. Deps installed; `tsc
      --noEmit` clean; `npm run dev` serves http://localhost:5173 (HTTP 200).
- [x] **W2** Web: `src/api/client.ts` (axios + localStorage tokens),
      `src/api/auth.ts`, `src/auth/AuthContext.tsx`, `LoginPage`. Admin-role gated.
- [x] **W3** Web: `RoutesListPage` — list + delete (with confirm).
- [x] **W4** Web: `RouteEditorPage` + `components/MapEditor.tsx` (mapbox-gl):
      waypoint tool, checkpoint tool, draggable markers, live line, checkpoint &
      tip editors. Directions snap in `src/lib/directions.ts`.
- [x] **W5** Web: Save builds full payload → `POST /routes` / `PUT /routes/:id`;
      "Snap to roads" computes `routeGeometry` + auto-fills distance/time; save
      also snaps if geometry missing.
- [x] **W6** Web: validation, error display, loading states, `admin/README.md`.
- [x] **X1** Backfill `routeGeometry` for the 7 existing seeded routes — done in
      **R2** below via `backend/scripts/backfill-route-geometry.ts`.
- [x] **P1** Mobile: fixed "no data without localhost" complaint. Root cause:
      `mobile/.env` `API_URL` pointed at `10.0.2.2`/`localhost`, which only works
      via `adb reverse`/emulator, not over plain Wi-Fi from a physical phone.
      Changed to the host PC's LAN IP: `API_URL=http://192.168.100.6:4001/api`
      (find via `ipconfig`, use the adapter on the same Wi-Fi/LAN as the phone).
      Verified fixed via `netstat -ano | grep ":4001"` showing a direct
      `192.168.100.6:4001 <-> <phone-ip>:*` socket (not loopback). **Caveat
      (dev-only, not a bug):** Metro's JS-bundle loading still needs either USB +
      `adb reverse tcp:8081 tcp:8081`, or phone+PC on the same Wi-Fi with the
      in-app dev menu pointed at the LAN IP:8081. This ROM (ColorOS / Realme
      RMX3630) blocks the usual adb-only workarounds (`adb shell settings put
      global/system debug_http_host ...` → `SecurityException`; no RN dev-settings
      `shared_prefs` file exists yet to hand-edit via `run-as`). Not a problem for
      a real release build (JS bundle is embedded, no Metro needed at all) — only
      affects this dev workflow.
- [x] **P2** Admin web: right-click-to-delete on the map, in addition to the
      existing "Remove" buttons in the lists below. `MapEditor.tsx` markers
      (`syncMarkers()`) now attach a `contextmenu` listener per waypoint/
      checkpoint marker element (`ev.preventDefault()` + `ev.stopPropagation()`,
      then call `onRemoveWaypoint(i)` / `onRemoveCheckpoint(i)`). New
      `MapEditorProps.onRemoveWaypoint`/`onRemoveCheckpoint` callbacks.
      `RouteEditorPage.tsx` adds a generic `removeWaypoint(i)` (re-indexes
      `sequence`, unlike the pre-existing `removeLastWaypoint` which only pops the
      last one) and passes both `onRemoveWaypoint={removeWaypoint}` /
      `onRemoveCheckpoint={removeCheckpoint}` into `<MapEditor>`. Hint text added
      next to the toolbar ("Right-click a marker on the map to delete it.").
      `npx tsc --noEmit` in `admin/` is clean.

## Round 3 — audit + fixes (after user asked "what else needs fixing?")

User asked for a self-review of the whole project. Found and fixed:

- [x] **R1** Admin: was missing the access-token auto-refresh that mobile already
      had (15min token, no refresh = 401s mid-edit). Added the same
      single-flight-refresh response interceptor to `admin/src/api/client.ts`
      (`getRefreshToken`, retry-once-then-redirect-to-/login-on-failure).
- [x] **R2** Backend: backfilled `routeGeometry` for the 6 routes that still had
      none (`backend/scripts/backfill-route-geometry.ts`, `npm run
      backfill:geometry`). Found a real Prisma bug while doing this: querying
      `routeGeometry: { equals: Prisma.JsonNull }` only matches the JSON-null
      *literal* — seeded routes had a true SQL `NULL` (column never set), which
      needs `Prisma.DbNull`. Script now checks both. All 7 routes now have a
      street-following line.
- [x] **R3** Mobile: localization rollout was incomplete — Login/Register and the
      entire Forum module (4 screens) were hardcoded English, ignoring the
      profile language picker; `RouteDetailScreen` had a few leftover hardcoded
      strings too ("Route map", "Tips & warnings", "Discussion", post-count
      pluralization, the start-failure alert). All now go through `useT()`/
      `translations.ts` (en/ru/kk). `utils/validation.ts` changed to take a `t`
      function and return localized messages instead of hardcoded English.
- [x] **R4** New feature (user request): tapping a forum post author's
      avatar/name now opens their **public profile** — name, member-since,
      aggregate stats, and their completed routes; tapping one opens a read-only
      track/stats view. Wired from `PostCard`, `PostDetailScreen` (post header +
      every comment), and `RoutePostsScreen`.
      - Backend: `GET /api/users/:id/profile` (new `user.service/controller/
        routes.ts`, mounted at `/users`). Returns `{ user: {id,name,createdAt},
        stats, activities }` — **only ever** `hidden: false` AND
        `completedAt != null` sessions; never email/role/in-progress/hidden ones.
        Verified by creating synthetic visible/hidden/in-progress sessions and
        confirming only the visible-completed one came back (then deleted them).
        This is also the first real "consumer" of the `hidden` flag from Round
        1/2 — before this, nothing ever read another user's progress list, so
        hiding an activity was a no-op in practice.
      - Mobile: `types/api.ts` `PublicProfile`, `api/users.api.ts`,
        `hooks/useUsers.ts`, new screens `UserProfileScreen` +
        `PublicActivityDetailScreen` (read-only, no hide/delete/share — finds
        the session from the already-fetched profile query cache, same pattern
        `ActivityDetailScreen` uses for "mine"), both added to `ForumStackParamList`
        + `ForumStack.tsx`.
- [x] **R5** Verified the admin panel in a **real headless browser** (Playwright,
      already cached locally — `npm install playwright@1.61.1` in a scratch dir,
      no project dependency added) instead of only typecheck/curl: logged in,
      created a route by clicking the map to drop 3 waypoints, **right-clicked a
      waypoint marker and confirmed it was deleted** (3→2), added + right-click-
      deleted a checkpoint (1→0), snapped to roads (got a real street-following
      line + auto-filled distance/time), saved, confirmed it appeared in the
      list, deleted it again to leave the DB clean. All steps passed. One real
      bug found and fixed *in the test script*: `page.mouse.click(x,y)` doesn't
      auto-scroll like a normal click, and the map sits below the fold under the
      form — had to `scrollIntoViewIfNeeded()` first or clicks silently miss.
- All three apps (`backend`, `mobile`, `admin`) typecheck clean; mobile's
  existing Jest suite (11 tests) still passes.

## RESUME HERE

> **Everything through Round 3 is DONE** — B1–B4, M1, W1–W6, P1, P2, X1, R1–R5.
> Backend :4001, mobile, and admin :5173 all typecheck clean. All 7 routes have
> street-following geometry. Admin has token auto-refresh. Localization covers
> the whole app (Auth, Explore, Forum, Profile, RouteDetail, ActiveNav, Summary)
> in en/ru/kk. Tapping a forum avatar opens a real public profile. The admin
> panel's create/edit/snap/right-click-delete/save flow was verified end-to-end
> in an actual headless browser (Playwright), not just typecheck/curl.
>
> Not yet done / honest gaps, roughly in order of value:
> 1. **No automated tests** beyond mobile's 2 small unit-test files (11 tests,
>    format/geo helpers only). Backend has zero (`npm test` doesn't even exist),
>    admin has zero. Everything from B1 onward was verified by hand (curl,
>    Playwright script, manual screenshots) rather than a checked-in test suite.
>    If this app keeps growing, the route full-upsert transaction and the new
>    public-profile privacy filter (must never leak hidden/in-progress sessions)
>    are the two things most worth covering first.
> 2. The `hidden` flag now has its first real consumer (R4's public profile) —
>    worth knowing the privacy boundary is: a public profile only ever returns
>    `hidden: false && completedAt != null` sessions, verified with synthetic
>    data in this round.
> 3. Release-build/demo-away-from-home caveats below still apply (ngrok URL is
>    ephemeral; release APK has the URL baked in at build time).
> 4. Smaller polish, still optional: image upload is URL-only, no drag-to-reorder
>    waypoint list, no map style toggle, no confirm-on-unsaved-changes-navigation.
>
> Servers may need restarting in a fresh session: backend `cd backend && npm run
> dev`; admin `cd admin && npm run dev`. For the phone: Metro needs `adb reverse
> tcp:8081 tcp:8081` (USB) — see P1 caveat above; the API itself no longer needs
> USB/adb, just same Wi-Fi + the LAN IP in `mobile/.env` (update it if the host
> PC's IP changes — check with `ipconfig`).

## Round 4 — "needs location access" bug + APK rebuild

User reported: location is on, the app has location access (confirmed in
Android Settings), but starting a route still shows "Location access needed".

- [x] **R6** Root cause found via `adb shell dumpsys package com.trailquest`:
      `ACCESS_FINE_LOCATION`/`ACCESS_COARSE_LOCATION` were `granted=true` but
      `ACCESS_BACKGROUND_LOCATION` was `granted=false` — completely normal,
      since Android's first-run dialog only ever offers "While using the app";
      "Allow all the time" requires a separate trip to system Settings that
      essentially no user does unprompted. The bug:
      `mobile/src/services/geolocation.ts`'s `BackgroundGeolocation.ready()`
      call never set `locationAuthorizationRequest`, so it defaulted to
      `'Always'`. With the configured expectation (`Always`) higher than what
      was actually granted (`WhenInUse`), `requestPermission()` resolved as
      denied even though real GPS access was fully granted. Fixed by setting
      `locationAuthorizationRequest: 'WhenInUse'` explicitly — this matches
      what the app actually needs: screen-off tracking already goes through
      `foregroundService: true` + a sticky notification, which works fine under
      WhenInUse and never required "Always" in the first place. Also removed
      the now-dead `backgroundPermissionRationale` config (it only fires when
      requesting an `Always` upgrade, which no longer happens).
      Verified via `adb shell dumpsys package` that the device's actual grant
      state (fine=true, background=false) is unchanged and now matches what
      the app expects — no user action needed, just reinstall the new APK.
- [x] **R7** Rebuilt the release APK (`cd mobile/android && JAVA_HOME="/c/Program
      Files/Eclipse Adoptium/jdk-21.0.10.7-hotspot" ./gradlew assembleRelease`),
      copied to `C:\Users\n2005\Downloads\TrailQuest.apk`, `adb install -r`'d
      over the existing install (same debug-keystore signature, same
      `com.trailquest` package — clean in-place upgrade, no uninstall needed).
      Second build only took ~1.5min (vs ~8min first time) since most native
      artifacts were already cached from the first release build in Round-3-era
      work.

## Demo away from home (phone off home Wi-Fi)

User wants to leave home and show the app to someone else, which the LAN-IP
fix (P1 above) doesn't cover — LAN IP only works on the home network. Chose
**ngrok tunnel** (DB/backend stay on this PC, nothing migrated to the cloud —
user explicitly didn't want to move the DB to a cloud provider). Declined a
release/production APK for now, so Metro is still required for the JS bundle.

- Backend keeps running locally (`cd backend && npm run dev`, :4001).
- Tunnel: `ngrok http 4001` → gives a public HTTPS URL
  (e.g. `https://0d7e-37-150-217-192.ngrok-free.app`) that forwards to the
  local backend. Check the current URL anytime with:
  `curl http://127.0.0.1:4040/api/tunnels` (while ngrok is running).
- **Free ngrok URLs change every time the tunnel is restarted.** Before a demo:
  1. Make sure backend (`npm run dev`) and `ngrok http 4001` are both running.
  2. Get the fresh URL from `http://127.0.0.1:4040/api/tunnels`.
  3. Put it in `mobile/.env` as `API_URL=<https-url>/api`.
  4. Restart Metro with `npx react-native start --reset-cache` (env value is
     baked in at bundle time via `react-native-dotenv`, so a plain reload of
     stale Metro won't pick up the change).
  5. Reload the app on the phone (shake menu → Reload, or relaunch).
- **Important limitation:** this only fixes the *data* layer (API calls can now
  reach the backend from anywhere with internet). The JS *bundle* is still
  served live by Metro, which still needs the phone to reach the dev machine —
  either USB + `adb reverse tcp:8081 tcp:8081`, or same Wi-Fi as the dev
  machine. **To truly show someone away from home with no laptop in hand, a
  release APK is required** (embeds the JS bundle, no Metro/Wi-Fi/USB needed at
  all) — user declined this for now, can revisit later (`cd android &&
  ./gradlew assembleRelease`, needs a signing config).
  Practical workaround until then: bring the dev laptop along and USB-connect
  the phone to it at the demo location; the laptop just needs internet (e.g.
  phone hotspot back to itself, or any Wi-Fi) for the ngrok tunnel to reach the
  backend running on it.

**Update: release APK built.** User decided to build it after all. Built with
`cd mobile/android && JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-21.0.10.7-hotspot" ./gradlew assembleRelease`
(JDK 21 required — `java` on PATH defaults to JDK 8, which fails with "Gradle
requires JVM 17 or later"). Output:
`mobile/android/app/build/outputs/apk/release/app-release.apk`, copied to
`C:\Users\n2005\Downloads\TrailQuest.apk` (~171MB, all 4 ABIs unsplit — fine for
sideloading, would need `splits.abi` config to shrink for a real release).
Signed with the default debug keystore (same as debug builds — `applicationId
"com.trailquest"` has no debug suffix, so `adb install -r` cleanly replaces the
debug build in place). Installed + launched on the test device and confirmed
via screenshot it loads real route data through the ngrok tunnel with **no
Metro/USB needed at all** — this is what makes it work away from home.
**Caveat:** the API_URL is baked in at build time from `mobile/.env` — this APK
is tied to whatever ngrok URL was active when it was built. If ngrok or the
backend restarts with a new URL, this APK needs a rebuild (update `.env`, rerun
`assembleRelease`) to work again. For a stable long-term URL, revisit the
earlier cloud-deploy option or a paid ngrok static domain.

## How to run (once built)

- Backend: `cd backend && npm run dev` → http://localhost:4001
- Admin web: `cd admin && npm install && npm run dev` → http://localhost:5173
  - set `admin/.env`: `VITE_API_URL=http://localhost:4001/api` and
    `VITE_MAPBOX_TOKEN=pk....` (same public token as mobile/.env)
- Log in with `admin@trailquest.app` / `password123`.

## Round 5 — full RU/EN/KK content editing (route title/description, checkpoint
## name/description, tip text) + "stops" localization + APK rebuild

User request: since the app has 3 languages (RU/EN/KK), the admin panel needs
to let an admin fill in route title, description, checkpoint labels, and tip
text in all 3 languages, with a language switcher so RU/KZ/EN can each be
filled in one at a time. Also the hardcoded English "stops" word under route
cards in the mobile app needed translating.

- [x] **S1** Mobile: `"{count} stops"` under each route card (`RouteCard.tsx`)
      was the one remaining hardcoded English string; added `route.stops` /
      `route.stopsOne` translation keys (en/ru/kk) to `translations.ts`.
- [x] **S2** Backend data model: `Route.title`/`.description`,
      `Checkpoint.name`/`.description`, `RouteTip.text` changed from single
      `String` columns to **3 flat columns each** (`titleRu`/`titleEn`/
      `titleKk`, etc, all `@default("")`), exposed over the API as a nested
      `{ ru, en, kk }` object (mapped in `route.service.ts`/`checkpoint.service
      .ts`/`tip.service.ts`/`progress.service.ts`/`user.service.ts`). Only `ru`
      is required by `localizedTextSchema` (`route.schema.ts`); `en`/`kk`
      default to `''` and can be filled in later via the admin panel.
      Migrated safely in 3 steps despite `prisma migrate dev` refusing
      non-interactive destructive changes: (1) additive migration adding the
      new columns alongside the old ones, (2) `backend/scripts/
      backfill-i18n-text.ts` (`npm run backfill:i18n`) copied existing English
      text into the new `*En` columns for all 7 routes/35 checkpoints/15 tips,
      (3) a second migration dropping the old columns, generated via `npx
      prisma migrate diff --script` (raw SQL) + a hand-made migration folder +
      `npx prisma migrate deploy` (the only way to apply a drop non-
      interactively on this machine).
- [x] **S3** Backend: `prisma/seed.ts` updated to the new `LocalizedText`
      shape. Route-level title/description got **real hand-written RU and KK
      translations** for all 7 seed routes (the highest-visibility content);
      checkpoint name/description and tip text kept only `en` (existing text)
      with `ru`/`kk` left empty — translating ~35 checkpoints × 2 fields + 15
      tips × 3 languages by hand wasn't worth it given the new admin UI exists
      to fill these in. Re-ran `npx prisma db seed` to push the RU/KK route
      translations into the live DB (the earlier backfill script only ever
      wrote `en`).
- [x] **S4** Mobile: new `LocalizedText` type in `types/api.ts`;
      `pickLocalized(text, lang)` + `usePickLocalized()` hook added to
      `src/i18n/index.ts` (falls back ru → en → kk if the current language
      isn't filled in yet). Applied at every render site: `RouteCard`,
      `RouteDetailScreen` (title/description/checkpoint rows/discussion nav
      param), `ExploreScreen` (map feature labels, picks via the plain
      `pickLocalized` fn since it's outside a hook), `ForumRoutesScreen`,
      `ActiveNavigationScreen`/`RunSummaryOverlay` (share message + display),
      `ActivityDetailScreen`/`ProfileScreen`/`UserProfileScreen`/
      `PublicActivityDetailScreen` (all `session.route.title` reads),
      `CheckpointModal`, `TipCard`, and `notifications.ts` (local checkpoint-
      reached notifications — reads the current language directly from
      `useLocaleStore.getState()` since it's outside React).
- [x] **S5** Admin: `LocalizedText`/`Locale` types + `LOCALES`/
      `LOCALE_LABELS`/`emptyLocalizedText`/`pickLocalizedText` added to
      `admin/src/types.ts`; all the relevant types (`Checkpoint`, `RouteTip`,
      `RouteSummary`, `RouteDetail`, `FullRoutePayload`, `AdminCheckpoint`,
      `AdminTip`) changed to use it. `RouteEditorPage.tsx` gained a single
      **route-wide language switcher** (RU/EN/KZ buttons, reusing the existing
      toggle-button-group pattern from the waypoint/checkpoint tool switcher)
      that drives which language's value shows in the Title, Description,
      every checkpoint's Name/Description, and every tip's Text field —
      exactly the requested flow: fill in RU for everything, switch to KZ,
      fill in KZ for everything, switch to EN. Validation only requires the
      `ru` field (matches the backend schema). `RoutesListPage` (route list)
      and `MapEditor.tsx` (checkpoint marker tooltip) updated to use
      `pickLocalizedText()` for the few spots that can't offer a language
      switcher.
- [x] **S6** All three apps (`backend`, `mobile`, `admin`) `tsc --noEmit`
      clean. Backend smoke-tested live (`npm run dev` + curl): `GET
      /api/routes` and `GET /api/routes/:id` both return the correct nested
      `{ru,en,kk}` shape, with checkpoint/tip fields correctly showing
      `en`-only (empty ru/kk) as expected pre-translation.
- [x] **S7** Rebuilt the release APK and installed on the phone (`adb install
      -r`). Build initially failed twice: once from a missing `ANDROID_HOME`
      in the background shell, then from a Metro-bundler `FATAL ERROR: ...
      out of memory` crash (multiple concurrent transform workers competing
      for memory under Windows). Fixed by uncommenting/setting
      `extraPackagerArgs = ["--max-workers", "2"]` in `mobile/android/app/
      build.gradle` to cap Metro's worker pool — retry succeeded in ~1m25s.

## RESUME HERE (updated)

> Through Round 5: full RU/EN/KK content editing exists end-to-end — admin can
> switch languages and fill in route title/description/checkpoint labels/tip
> text per-language; mobile picks the right language at render time with a
> ru→en→kk fallback chain; the "stops" label under route cards is localized.
> Checkpoint/tip RU and KK text is **not yet filled in** for the 7 seed routes
> (only route-level title/description got real translations) — next time
> someone's in the admin panel, switching to RU/KZ tabs on checkpoints/tips
> will show blank fields that need filling in. New release APK installed on
> the test phone with this round's changes.

## Round 6 — geolocation off the paid plugin + localized region/country + admin fixes

Three issues + a big migration.

- [x] **R8** Admin save showed stale data until a hard refresh. `RouteEditorPage`
      hydrates server data into local state once (a `hydrated` flag), so after
      save the still-cached query re-fed the old values. Fix: on save,
      `queryClient.removeQueries(['route', id])` (not just invalidate) +
      `invalidateQueries(['routes'])` before navigating away.
- [x] **R9** Region + Country are now **per-language** (ru/en/kk), like
      title/description. Schema: `region`/`country` → `regionRu/En/Kk`,
      `countryRu/En/Kk` (additive migration + `backfill:i18n-region-country`
      into `*En`, then drop-legacy migration via the diff+deploy trick).
      `GET /routes/countries?lang=` returns localized country names; the country
      filter matches across all three columns. Mobile + admin updated to the
      `{ru,en,kk}` shape; admin's language switcher now also drives Region +
      Country fields. Seed has real ru/kk region+country for all 7 routes.
- [x] **R10 — THE big one: dropped the paid background-geolocation plugin.**
      Root cause of the recurring "no location access" in **release** builds:
      `react-native-background-geolocation` (Transistor) is commercial — it works
      in debug but a RELEASE build logs `LICENSE VALIDATION FAILURE` and refuses
      to track, which our code surfaced as a permission denial. A license is
      $400/yr — declined. Replaced with **free** `@react-native-community/
      geolocation` (TurboModule, new-arch OK). `services/geolocation.ts` keeps
      the same exported surface (`configureTracking`/`requestLocationPermission`/
      `getLocationAuthStatus`/`startTracking`/`getCurrentPosition`,
      `LocationSample`/`LocationAuth`) so no callers changed; permissions now via
      `PermissionsAndroid` (FINE_LOCATION → 'whenInUse'). Removed the plugin's
      maven repo block from `android/build.gradle` (it referenced the now-gone
      project and would break Gradle). **Confirmed working on device** —
      real-time position + (old) auto checkpoint trigger both worked in the
      release build. NOTE: this is **foreground tracking** (screen on). Reliable
      screen-off/background tracking needs a foreground service — deferred.
      Also localized `formatDuration` units (ч/мин, сағ/мин, h/m) in this round.

## Round 7 — QR checkpoints + per-country XP/levels/ranks + checkpoint-based progress

User + client reworked the checkpoint system: checkpoints are marked by
**scanning a physical QR** (not GPS auto-trigger), with an XP/level/rank system
per country, a celebratory scan card, and progress measured by checkpoints.
Decisions locked with the user: QR-only (no GPS proximity check — so the admin's
on-screen QR can be scanned from home to test); admin generates the QR images;
levels per-country only; +50 XP/checkpoint, +100 bonus for all QRs on a route,
11 levels (Новичок→Профессионал).

**Phase A — backend + admin (DONE, smoke-tested via curl):**
- [x] **Q1** Schema: `Checkpoint.qrCode` now `@unique` + always populated with a
      stable token (`cp_<base64url>`), preserved across route edits (admin
      round-trips it; server mints one for new checkpoints). New tables
      `checkpoint_scans` (one row per scanned checkpoint per session, unique on
      `(progressId,checkpointId)` → idempotent, no double XP) and
      `user_country_progress` (per-country XP, `@@unique([userId,country])`,
      keyed by the canonical `Route.countryEn`). Additive migration via
      diff+deploy (non-interactive).
- [x] **Q2** `src/lib/levels.ts`: XP curve (`LEVEL_THRESHOLDS` 0..4000 over 11
      levels), `XP_PER_CHECKPOINT=50`, `XP_ROUTE_COMPLETE_BONUS=100`, localized
      `RANKS` (ru/en/kk), `levelForXp()` → `{level,rank,xp,xpIntoLevel,
      xpForNextLevel,progress}`.
- [x] **Q3** `PATCH /progress/:id/scan { qrCode }` — validates the QR belongs to
      a checkpoint on the session's route, records the scan, awards XP into the
      route's country (upsert), returns localized checkpoint + xp + reached/total
      + level for the scan card. Idempotent rescans give 0 XP. Bad QR → 400.
      `GET /progress/levels` — per-country level list for the Profile.
- [x] **Q4** `route.service` mints/preserves qrCode in the upsert; seed generates
      qrCodes. Re-seeded. **Smoke test passed**: scanning all 5 checkpoints of a
      route gave +50 each then +150 on the last (50+100 bonus), level rose 0→2,
      idempotent rescan = +0, two countries tracked with localized names.
- [x] **Q5** Admin: `qrcode.react` renders a printable QR + label + code +
      "Download PNG" under each saved checkpoint in `RouteEditorPage`
      (`CheckpointQr`). New checkpoints show "save to generate". This is what the
      user tests from home (scan the on-screen QR with the phone).

**Phase B — mobile (code complete, tsc clean; release build in progress):**
- [x] **Q6** Swapped QR scanner libraries: vision-camera v5 needs Nitro modules
      and dropped the simple `useCodeScanner` (object-detection API only) — wrong
      fit. Settled on **`react-native-camera-kit`** (single native module,
      `codegenConfig type:"all"` = new-arch OK, simple `<Camera scanBarcode
      onReadCode>`). `QRScannerModal.tsx`: full-screen camera, CAMERA permission
      via PermissionsAndroid, fires `onScanned` once per open. CAMERA permission
      added to the manifest.
- [x] **Q7** `ScanResultCard.tsx`: the celebratory card (hero image or coloured
      icon band, localized name/description, +XP pill, route-bonus line,
      checkpoints + country/rank stats). New `scan.*` + `rank.*` i18n keys
      (en/ru/kk).
- [x] **Q8** `useNavigationEngine` reworked: removed the GPS proximity
      auto-trigger + checkpoint notifications; progress is now `scanned/total`;
      added `scan(qrCode)` → posts to the scan endpoint, updates reached set +
      fraction, returns the result. `ActiveNavigationScreen` gained a **Scan QR**
      button (next to Finish) → `QRScannerModal` → `ScanResultCard`.
- [x] **Q9** Profile: "Ranks by country" section (`RanksSection`/`RankRow`) via
      `useMyLevels()` — per-country level badge, rank name, XP, progress bar to
      next level. Levels query invalidated after each scan.
- [ ] **Q10** Rebuild release APK with camera-kit + install + user tests the full
      flow (scan admin's on-screen QR → card → XP → rank). IN PROGRESS.

> RESUME (Round 7): Phases A fully done + curl-verified. Phase B all code done,
> all three apps tsc-clean. Last step is the release APK build with the new
> camera native module and an on-device test of the end-to-end scan flow.
> Backend on :4001 must be running; admin shows the QRs to scan.
> **Note (Round 8):** the on-device QR-scan test in Q10 is still not done —
> Round 8 below was a separate infra push and didn't touch this.

## Round 8 — permanent hosting (Render + Neon) + permanent APK link + update banner

User no longer wanted to run ngrok manually and wanted a permanent, free,
always-on backend+DB, plus a permanent APK download link that auto-updates
and an in-app "update available" banner for new releases.

Evaluated Fly.io first (originally planned) — WebSearch confirmed Fly killed
its free tier in 2024 (now requires a card, ~$2-10/mo for always-on). Switched
to **Render (free web service) + Neon (free Postgres) + cron-job.org
keep-alive ping every 10min** (prevents Render's free-tier sleep, so
effectively no cold start) — fully free, no card, user confirmed this combo.

- [x] **G1** Git repo initialized at the repo root for the first time (monorepo
      was never under version control before). Root `.gitignore` added
      (`.idea/`, `.claude/`, etc.). Found and fixed: `mobile/.gitignore` had
      `!debug.keystore` (standard RN convention — debug keystore is normally
      shareable/non-sensitive), but this project's release APKs are actually
      **signed with that same debug keystore** (see Round 4-ish APK builds),
      so publishing it in a now-public repo would leak the real release-signing
      key. Removed the negation so `*.keystore` is fully ignored; the file
      still exists locally for builds, just isn't committed.
- [x] **G2** GitHub CLI installed (`winget install GitHub.cli`), authenticated
      as `exRonas` via device-code flow. Public repo created:
      **github.com/exRonas/trailquest**.
- [x] **G3** Backend: `prisma/schema.prisma` datasource gained `directUrl =
      env("DIRECT_URL")` (Neon's recommended split: pooled URL for the app,
      direct/unpooled URL for `prisma migrate deploy`, avoiding pgbouncer
      transaction-mode issues during migrations). `backend/.env`/`.env.example`
      updated with `DIRECT_URL` (same value as `DATABASE_URL` for local dev).
- [x] **G4** `render.yaml` (repo root, Render Blueprint) added: Node runtime,
      `rootDir: backend`, `buildCommand: npm install --include=dev && npx
      prisma generate && npm run build`, `startCommand: npx prisma migrate
      deploy && npm start`, free plan, `/api/health` healthcheck. Two real bugs
      hit and fixed on first deploy:
      1. Render sets `NODE_ENV=production` during the **build** step too,
         which makes plain `npm install` skip `devDependencies` (typescript,
         prisma CLI) — build failed on `tsc`/`prisma generate`. Fixed with
         `--include=dev`.
      2. Runtime crashed with `Cannot find module dist/index.js`. Root cause:
         `tsconfig.json`'s `rootDir` is `./` (covers both `src/` and
         `prisma/`), so `tsc` mirrors that into `dist/src/index.js`, not
         `dist/index.js` as `package.json` assumed. **Pre-existing bug**, never
         caught before because local dev always ran `ts-node-dev` against
         `src/` directly, never the actual compiled build — this was the
         first time the app ran from `dist/`. Fixed `package.json`
         `main`/`start` to point at `dist/src/index.js`.
- [x] **G5** Backend: `GET /api/app-version` added (`src/config/appVersion.ts`
      — plain constant, no DB/admin UI, bumped by hand alongside each release,
      same spirit as the existing `versionCode` bump ritual). Returns
      `{ latestVersionCode, latestVersionName, downloadUrl, notes }`.
- [x] **G6** Data migration: `pg_dump` (local Postgres 16) → `psql` restore
      into Neon (direct/unpooled connection), `--no-owner --no-privileges`
      since the Neon role differs from local `postgres`. Two `psql`/`pg_dump`
      CLI gotchas hit: (1) `pg_dump` connection URIs don't accept Prisma's
      `?schema=public` query param — libpq rejects `schema` as an unknown
      connection option, had to drop it; (2) `psql` stops parsing `-f`/`-v` as
      options once it sees a positional arg (the connection string) before
      them — options must come *before* the connection string on the command
      line. All 8 routes, 35 checkpoints, 17 tips, 3 users, and the full
      `_prisma_migrations` history (so `migrate deploy` sees "no pending
      migrations") verified present in Neon after restore.
- [x] **G7** Render web service live at
      **https://trailquest-backend-uze0.onrender.com** (Frankfurt region, same
      as the Neon project — keeps DB round-trips local to the region). New
      random `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` generated for production
      (not reused from local `.env`). `/api/health`, `/api/routes`,
      `/api/app-version` all curl-verified live with real migrated data.
- [x] **G8** `mobile/.env` and `admin/.env` `API_URL`/`VITE_API_URL` repointed
      from the (now-dead) ngrok tunnel to the Render URL — this also
      permanently fixes the earlier "only works on home Wi-Fi/ngrok" problem,
      since Render is reachable from anywhere with no PC/tunnel running.
- [x] **G9** cron-job.org keep-alive job created by the user, hitting
      `/api/health` every 10 minutes — keeps the Render free instance from
      spinning down, so in practice there's no cold-start delay.
- [x] **G10** Mobile: in-app update banner. `src/config/appVersion.ts`
      (`CURRENT_VERSION_CODE`, hand-bumped alongside `android/app/
      build.gradle`'s `versionCode` — no `react-native-device-info` dependency
      added, since a full rebuild is already required for every release
      anyway). `api/appVersion.api.ts` + `api/hooks/useAppVersion.ts` (react-
      query, same pattern as `useRoutes.ts`). `components/UpdateBanner.tsx`
      wraps the existing `<Banner tone="info">` in a `Pressable` that opens
      `downloadUrl`; mounted in `RootNavigator.tsx` after `NavigationContainer`
      so it's visible on every screen regardless of auth state. New
      `update.available`/`update.message`/`update.action` i18n keys (en/ru/kk).
- [x] **G11** Release APK rebuilt (now bundling the Render URL, verified by
      grepping the extracted JS bundle for `onrender.com` vs the old
      `ngrok-free.app`) and published as **GitHub Release v1.0**, asset always
      named `TrailQuest.apk`. Permanent download link (never changes across
      future releases as long as the asset keeps this exact name):
      `https://github.com/exRonas/trailquest/releases/latest/download/TrailQuest.apk`
      — curl-verified it resolves (200, correct size/filename).

### How to ship a new APK version (going forward)

1. Bump `versionCode`/`versionName` in `mobile/android/app/build.gradle`, and
   bump `CURRENT_VERSION_CODE` in `mobile/src/config/appVersion.ts` to match
   — this is what makes *older* installs recognize the new build as newer
   than themselves once step 2 below ships.
2. Bump `backend/src/config/appVersion.ts`'s `latestVersionCode` (and
   `latestVersionName`/`notes`) to the same new version — this is what
   already-installed older apps compare against to show the banner.
3. `git push` (Render auto-redeploys the backend with the new
   `appVersion.ts` on push to `master`).
4. `cd mobile/android && JAVA_HOME="/c/Program Files/Eclipse
   Adoptium/jdk-21.0.10.7-hotspot" ./gradlew assembleRelease`.
5. `gh release create vX.Y android/app/build/outputs/apk/release/app-release.apk#TrailQuest.apk --repo exRonas/trailquest --title "TrailQuest vX.Y" --notes "..."`
   (the `#TrailQuest.apk` renames the uploaded asset — keep this exact name
   every time so the permanent `/releases/latest/download/TrailQuest.apk` link
   keeps working).

## RESUME HERE (Round 8)

> Backend + DB are now permanently hosted (Render + Neon, both free, Frankfurt
> region) and no longer depend on this PC, ngrok, or home Wi-Fi being up —
> the keep-alive cron job means there's effectively no cold start either.
> `mobile/.env`/`admin/.env` point at the Render URL. A public GitHub repo
> (github.com/exRonas/trailquest) now exists with a permanent, always-current
> APK download link, and the app shows an in-app banner when a newer version
> is published. v1.0 is live at that link right now.
>
> Not yet done / honest gaps:
> 1. **Q10 from Round 7 is still open** — no on-device test of the QR-scan →
>    XP → rank flow has happened yet (this round was purely infra, didn't
>    touch that). The v1.0 APK published today does include the camera-kit
>    scan code from Round 7, just untested on a real device.
> 2. The in-app update banner itself hasn't been observed on a real device
>    either — only curl-verified the API side and grepped the bundled JS for
>    the right URL. To see it fire, temporarily set `latestVersionCode` higher
>    than `CURRENT_VERSION_CODE` on the backend, reload the app, confirm the
>    banner shows and tapping it opens the GitHub release page, then revert.
> 3. Render's free plan is single-instance with no autoscaling — fine for
>    5-10 test users, would need a paid plan before any real growth.
> 4. Neon's free tier project also has its own idle-suspend behavior
>    (independent of Render's), but Neon's cold start is sub-second/a couple
>    seconds, not the 30-50s Render used to have — combined with the keep-alive
>    ping keeping Render's requests flowing (which also touches the DB), this
>    hasn't been an issue in testing so far.

---

## Round 9 — Profile avatars: themed picker UI (2026-07-07)

Finished the avatar feature left half-done in Round 8's working tree (backend
migration/endpoint, `Avatar.tsx` renderer, and `useUpdateAvatar` mutation all
existed — the picker UI didn't).

- [x] **H1** Decision: **no `react-native-svg` / no custom SVG art.** Avatars
      stay MaterialCommunityIcons-on-colored-disc — zero new native deps (no
      APK rebuild complexity, no size increase), guaranteed visual consistency
      with the rest of the app's iconography.
- [x] **H2** `mobile/src/components/avatars.ts`: icon set expanded 12 → 24.
      First 12 are trail/nature-themed (`image-filter-hdr` mountains, `hiking`,
      `tent`, `campfire`, `compass`, `binoculars`, `pine-tree`, `kayaking`,
      `leaf`, `flower-tulip`, `mushroom`, `snowflake`); the original 12 animals
      kept after them so already-stored avatar ids keep rendering. All names
      verified against `react-native-vector-icons` glyphmap JSON. Backend zod
      regex `^[a-z-]+-\d+$` (max 40) still matches every new id.
- [x] **H3** New `mobile/src/components/AvatarPicker.tsx`: bottom-sheet
      `Modal` — live preview disc, 6-color dot row, 24-icon grid, "Save" +
      "Use initials" (reset to `null`, only shown when an avatar is set).
      Re-syncs selection from the stored id each open.
- [x] **H4** `ProfileScreen.tsx`: avatar wrapped in `Pressable` with a small
      pencil badge; opens the picker; save goes through `useUpdateAvatar`
      (which already writes the returned user into `authStore`). Error path:
      `Alert` with `avatar.saveFailed`.
- [x] **H5** i18n: `avatar.title`/`avatar.save`/`avatar.reset`/
      `avatar.saveFailed` added in en/ru/kk. `npx tsc --noEmit` clean.

> Not yet verified on device: picker look & feel (sheet height, grid spacing)
> — needs a Metro run before shipping in the next APK.

---

## Round 10 — checkpoint-resume bug, tests, forum moderation, image upload (2026-07-07/08)

Live on-device testing (USB debug on a real Realme phone) surfaced two real
bugs; user then asked for five more features in one message.

- [x] **R1** Bug: `getCurrentPosition()` used `enableHighAccuracy: true` +
      `maximumAge: 10000`, forcing a raw GPS satellite fix on every call.
      Confirmed via `adb logcat`: gps provider registered, removed after
      exactly 15s (timeout), no fix — indoors this basically never resolves.
      Explore stayed on "all routes" forever. Fixed: `enableHighAccuracy:
      false`, `maximumAge: 5min` — uses the fast cached network/fused
      provider instead. Only used for the "nearby routes" bucket (±50km),
      never for live navigation tracking, so the accuracy tradeoff is fine.
      Shipped as v1.2.
- [x] **R2** Bug: `TrackMap` showed the generic "set MAPBOX_PUBLIC_TOKEN"
      placeholder both when the token was missing AND when a session simply
      had zero recorded GPS points (e.g. finished immediately without
      moving) — message lied in the second case. Gave the empty-track case
      its own `activity.noTrack` message.
- [x] **R3** Bug: resuming an in-progress route (exit + re-enter navigation)
      showed every checkpoint as unvisited again, even though scans persist
      server-side (`CheckpointScan`). `startRoute()` now returns
      `reachedOrderIndices`, threaded through nav params into
      `useNavigationEngine`'s initial state. Also added a checkmark symbol +
      dimmed circle on reached checkpoints (color-alone wasn't obvious
      enough).
- [x] **R4** XP investigated, not a bug: overall level sums XP across every
      `UserCountryProgress` row (850 XP = level 2 under the new curve from
      Round 9's retune) — the 850 came from Round 7-era test scans on
      2026-06-30/07-01, not "one walk". Offered to reset the test account;
      not yet done (waiting on user).
- [x] **R5** Backend test suite (previously zero): Jest + ts-jest, 24 tests —
      `lib/levels` curve edge cases, `utils/geo` haversine/path/speed math,
      an integration test against the local dev Postgres for the
      public-profile privacy filter (hidden/in-progress must never leak),
      and a cascade-delete check for the new forum moderation path. Test
      files excluded from the `tsc` build output.
- [x] **R6** Forum moderation: `GET/DELETE /api/posts` (admin-only list-all +
      delete-post, comments cascade via existing FK), `DELETE
      /api/posts/:id/comments/:commentId` for pruning a single comment. New
      admin `/forum` page: post list, expandable comment list, delete
      buttons, nav link added to the top bar.
- [x] **R7** Image upload: new `Image` Prisma model (blob storage — no
      object-storage account needed on the free-tier stack). Admin picks a
      file → resized to fit 1600px + re-encoded JPEG q0.82 via canvas →
      base64-POSTed to `POST /api/images` → served from `GET
      /api/images/:id` with a year-long immutable `Cache-Control` (a
      replaced image gets a new id; the old row is deleted). Orphan cleanup
      wired into `route.service` (replace/update/delete) and
      `checkpoint.service` (update): diffs old vs new coverImageUrl/mediaUrl
      on every save, deletes any of our own rows that dropped out — matched
      by URL pattern, so a manually-pasted external URL is never touched.
      Caught and fixed live: helmet's default `Cross-Origin-Resource-Policy:
      same-origin` would have silently broken `<img>` previews in the admin
      panel (a different Render origin than the backend) — set to
      `cross-origin` on the image route. Verified end-to-end against the
      local DB with curl: upload → attach to a route → replace with null →
      old image 404s.
- [x] **R8** Shipped as v1.4 (versionCode 5); pushed to master, Render
      Blueprint auto-sync redeploys backend + admin on push (no manual step
      once confirmed enabled).

> User confirmed on 2026-07-08, all live/working:
> - Render deploy is live (backend + admin).
> - Image upload and comment-delete both work through the real admin site.
> - Avatar picker looks good on-device.
> - QR-scan → XP → rank-up flow works (Round 7's Q10 finally closed).
> - Current XP left as-is (offer to reset the test account was declined).
>
> Remaining, low-priority:
> - Offline map tiles — explicitly deferred by the user, revisit later.

---

## Round 11 — checkpoint marker style iteration (2026-07-08)

User didn't like the reached=green color-swap (hid the type color) or the
plain white unvisited fill (too stark, no way to tell which one in sequence).
Two quick style passes, both mobile-only (`ActiveNavigationScreen.tsx`):

- [x] **S1** Outline-vs-fill: unvisited = white ring, colored outline;
      visited = solid disc in that type color + checkmark. Type is never
      hidden by "done" anymore.
- [x] **S2** Order number + softer fill: unvisited fill changed white →
      `colors.checkpoint.*.soft` (tinted), with the checkpoint's order number
      rendered on top so the sequence stays legible before scanning anything.
      Visited unchanged (solid + checkmark).
- Shipped as v1.5 then v1.6 (versionCode 6, 7) same session, back to back.

> Not yet verified on device — both style passes went out on trust (`tsc`
> clean, no runtime testing). Worth a real look next time the phone's
> plugged in, alongside the still-untouched `RoutePreviewMap.tsx` (the
> pre-start preview never got the order-number/soft-fill treatment — still
> shows plain solid-by-type + white number).
