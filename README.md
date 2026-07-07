# TrailQuest

A production-grade hiking-route navigator: explore curated trails (historical
sites, battlefields, scenic overlooks) on a map, walk them with live GPS
navigation, get automatic checkpoint alerts when you enter a checkpoint's
radius, and share tips in a per-route forum.

This is a monorepo with two independent projects plus shared docs.

```
trailquest/
├── backend/    # Node + Express + TypeScript + PostgreSQL + Prisma REST API
├── mobile/     # React Native (bare CLI) + TypeScript app
├── docs/       # TECHNICAL_SPEC.md, CLAUDE_CODE_BUILD_PROMPT.md
└── claude-context.md
```

## Quick start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env          # set DATABASE_URL + JWT secrets
npx prisma migrate dev --name init
npx prisma db seed            # 4 real routes, checkpoints, tips, users, a thread
npm run dev                   # http://localhost:4000  (GET /api/health)
```

Need Postgres fast?

```bash
docker run --name trailquest-db -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=trailquest -p 5432:5432 -d postgres:16
```

Full details: [`backend/README.md`](backend/README.md).

### 2. Mobile

```bash
cd mobile
npm install
cp .env.example .env          # set API_URL + MAPBOX_PUBLIC_TOKEN (map is optional)
npm start                     # Metro
npm run android               # or: npm run ios  (after pod install)
```

Full details (Mapbox tokens, background geolocation, native setup):
[`mobile/README.md`](mobile/README.md).

### Demo credentials (seeded)

| Role  | Email                  | Password      |
|-------|------------------------|---------------|
| User  | `hiker@trailquest.app` | `password123` |
| Admin | `admin@trailquest.app` | `password123` |

## What works end-to-end

- Register / login with JWT (access + refresh), tokens stored in the device
  Keychain/Keystore, auto-login on relaunch.
- Explore routes on a clustered Mapbox map with a bottom-sheet list and
  category/difficulty filters.
- Route detail: description, stats, a route-line + checkpoint preview map,
  visually-distinct tips/warnings, and a checkpoints list.
- Start a route → live navigation HUD (speed, distance, elapsed, progress, ETA)
  with real GPS, background tracking, and **automatic checkpoint geo-triggers**
  (Haversine within each checkpoint's radius) that fire a local notification and
  a modal.
- Forum: browse posts per route, read/threaded comments, create posts and
  comments with optimistic updates.
- Profile: completed/in-progress routes with distance/time/date stats; logout.

## Tech

| Layer    | Choices |
|----------|---------|
| Backend  | Express, TypeScript (strict), PostgreSQL, Prisma, JWT, Zod, bcrypt, helmet |
| Mobile   | React Native 0.86, TypeScript (strict), @rnmapbox/maps, react-native-background-geolocation, React Navigation, Zustand, React Query, Notifee, Keychain |
| Geo      | Plain lat/lng + Haversine (no PostGIS); server-side path-log distance/speed, client-side checkpoint triggers + speed smoothing |

## Verification status

- **Backend:** ran for real against a local PostgreSQL 16 instance —
  `prisma migrate dev` + `prisma db seed` applied successfully, then live
  HTTP calls confirmed: health check, route listing, login (JWT issued),
  start route → log GPS points → complete (Haversine distance/speed computed
  correctly), forum posts list. Also `tsc --noEmit` clean and production
  build (`npm run build`) clean. Runs on **port 4001** in this environment
  (4000 was occupied by an unrelated local service — update if that's not
  the case on your machine).
- **Mobile:** `tsc --noEmit` clean, Jest unit tests pass, and the **Metro
  bundler successfully built the full JS bundle for both Android and iOS**
  (`react-native start` + fetched `index.bundle`). This caught and fixed a
  real issue: `react-native-reanimated@3.x` doesn't work with RN 0.86 (it
  references a legacy renderer file RN 0.86 removed) — upgraded to
  `react-native-reanimated@^4.5.0` + `react-native-worklets@^0.10.0`, which
  officially target RN 0.83–0.86.
  Native on-device/emulator builds were **not** run here — there's no Android
  emulator (AVD) configured and no physical device attached, and creating an
  emulator image is a multi-GB download outside this session's scope. See the
  guide below for exactly how to run it on your machine.

## Not in this build

AR/camera overlays, QR scanning, an admin panel UI (manage data via Prisma
Studio), forum moderation, and offline map tiles (a `TODO` marker is left in
`mobile/src/screens/RouteDetail/RouteDetailScreen.tsx`).

See [`docs/TECHNICAL_SPEC.md`](docs/TECHNICAL_SPEC.md) for the full spec.
