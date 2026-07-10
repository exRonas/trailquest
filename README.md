# TrailQuest

A production-grade hiking-route navigator: explore curated trails (historical
sites, battlefields, scenic overlooks) on a map, walk them with live GPS
navigation, scan QR checkpoints to earn XP and country ranks, and share tips
in a per-route forum. RU/EN/KK throughout. Landing page + download:
**[exronas.github.io/trailquest](https://exronas.github.io/trailquest)**.

This is a monorepo: mobile app, backend API, browser admin panel, landing
page, plus shared docs.

```
trailquest/
├── backend/    # Node + Express + TypeScript + PostgreSQL + Prisma REST API
├── mobile/     # React Native (bare CLI) + TypeScript app — Atlas design
├── admin/      # Vite + React + TypeScript browser admin panel
├── site/       # Static landing page (GitHub Pages)
├── docs/       # TECHNICAL_SPEC.md, ADMIN_WEB_PROGRESS.md, CLAUDE_CODE_BUILD_PROMPT.md
└── claude-context.md
```

## Quick start

### Live / hosted

The real app talks to a permanently-hosted backend + DB, not localhost:

- Backend: **https://trailquest-backend-uze0.onrender.com** (Render, free
  tier, kept warm by a cron-job.org ping) + **Neon** Postgres (Frankfurt).
- Landing page + APK download: **https://exronas.github.io/trailquest**.
- Local setup below is only needed for development.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env          # set DATABASE_URL + DIRECT_URL + JWT secrets
npx prisma migrate dev --name init
npx prisma db seed            # 8 real routes, checkpoints, tips, users, a thread
npm run dev                   # http://localhost:4001  (GET /api/health)
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

Full details (Mapbox tokens, native setup): [`mobile/README.md`](mobile/README.md).

### 3. Admin panel

```bash
cd admin
npm install
cp .env.example .env          # set VITE_API_URL + VITE_MAPBOX_TOKEN
npm run dev                   # http://localhost:5173
```

Full details: [`admin/README.md`](admin/README.md).

### Demo credentials (seeded)

| Role  | Email                  | Password      |
|-------|------------------------|---------------|
| User  | `hiker@trailquest.app` | `password123` |
| Admin | `admin@trailquest.app` | `password123` |

## What works end-to-end

- Register / login with JWT (access + refresh), tokens in the device
  Keychain/Keystore, auto-login on relaunch.
- Explore routes on a clustered Mapbox map (defaults to the user's own
  location) with a bottom-sheet list and category/difficulty filters.
- Route detail: description, stats, road-snapped route line + checkpoint
  preview map, ratings/reviews, tips/warnings, offline map download.
- Start a route → live navigation HUD (speed, distance, elapsed, progress,
  ETA). Checkpoints are marked by **scanning a physical/on-screen QR code**
  (not GPS proximity), awarding XP toward per-country levels/ranks, with a
  celebratory scan card.
- **Offline-first**: start/scan/complete all queue locally and auto-sync
  when connectivity returns; the route list itself is cached for a cold
  start with no signal.
- Forum: browse posts per route, threaded comments, tap an author to see
  their public profile; admin moderation (delete post/comment).
- Profile: completed/in-progress routes, achievements, friends, global +
  monthly leaderboard, avatar picker, dark/light/system theme, RU/EN/KK.
- Browser **admin panel**: create/edit routes with a road-snapping map
  editor, QR generation per checkpoint, per-language (RU/EN/KK) content
  editing, image upload, forum moderation, analytics dashboard.
- In-app update banner (compares against the backend's published version).

## Tech

| Layer    | Choices |
|----------|---------|
| Backend  | Express, TypeScript (strict), PostgreSQL (Neon), Prisma, JWT, Zod, bcrypt, helmet, hosted on Render |
| Mobile   | React Native 0.86, TypeScript (strict), @rnmapbox/maps, @react-native-community/geolocation, react-native-camera-kit (QR), React Navigation, Zustand, React Query, Notifee, Keychain, AsyncStorage, reanimated 4, gesture-handler, view-shot/share |
| Admin    | Vite, React, TypeScript, react-router-dom, @tanstack/react-query, axios, mapbox-gl, qrcode.react |
| Design   | Single in-house design language ("Atlas" — expedition/archive style, custom SVG decor), dark/light/system theming |
| Geo      | Plain lat/lng + Haversine (no PostGIS); road-snapping via Mapbox Directions at admin edit-time; QR-scan checkpoints (no GPS proximity check) |

## Not in this build

AR/camera overlays (Phase 2 — the data model is AR-ready but unbuilt), push
notifications (needs a Firebase/FCM project), password reset (needs an
SMTP/email service).

See [`docs/ADMIN_WEB_PROGRESS.md`](docs/ADMIN_WEB_PROGRESS.md) for the full,
round-by-round build history and current gaps, and
[`docs/TECHNICAL_SPEC.md`](docs/TECHNICAL_SPEC.md) for the original concept
spec (checkpoints there are described as GPS-triggered; QR-scan replaced
that — see the progress doc's Round 7).
