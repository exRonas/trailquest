# TrailQuest — Backend API

REST API for the TrailQuest hiking-route navigator: auth, routes, QR-scan
checkpoints with per-country XP/levels, route tips, offline-tolerant
navigation progress, ratings/reviews, achievements, friends, a leaderboard,
image uploads, and a per-route forum with moderation. Content (route/
checkpoint/tip text, region, country) is stored per-language (RU/EN/KK).

**Stack:** Node.js · Express · TypeScript (strict) · PostgreSQL · Prisma · JWT · Zod

**Live:** https://trailquest-backend-uze0.onrender.com (Render, free tier,
kept warm by a cron-job.org keep-alive ping) + Neon Postgres (Frankfurt).

---

## Prerequisites

- Node.js 18+ (built and tested on Node 22/24)
- A PostgreSQL 13+ database (local install, Docker, or a hosted instance)

> No PostGIS required — geo math (Haversine distance, path/speed) is done in
> application code (`src/utils/geo.ts`). Checkpoints are marked by QR scan,
> not GPS proximity — GPS is still used for live-navigation stats and the
> "nearby routes" bucket on Explore.

## Quick start

```bash
cd backend

# 1. Install deps
npm install

# 2. Configure environment
cp .env.example .env
#   then edit .env — at minimum set DATABASE_URL, DIRECT_URL, and the two JWT secrets

# 3. Create the schema + tables
npx prisma migrate dev --name init

# 4. Seed sample data (8 real routes, checkpoints w/ QR codes, tips, users, a forum thread)
npx prisma db seed

# 5. Run the dev server (auto-reload)
npm run dev
# → http://localhost:4001  (health: GET /api/health)
```

Spinning up Postgres quickly with Docker:

```bash
docker run --name trailquest-db -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=trailquest -p 5432:5432 -d postgres:16
# matches the default DATABASE_URL in .env.example
```

## Seeded credentials

| Role  | Email                   | Password      |
|-------|-------------------------|---------------|
| Admin | `admin@trailquest.app`  | `password123` |
| User  | `hiker@trailquest.app`  | `password123` |

The admin account is required to exercise the admin-only write endpoints
(create/update/delete routes, checkpoints, tips).

## Scripts

| Script                    | Purpose                                       |
|---------------------------|-----------------------------------------------|
| `npm run dev`             | Dev server with hot reload (ts-node-dev)      |
| `npm run build`           | Compile TypeScript to `dist/`                 |
| `npm start`               | Run compiled server (`dist/index.js`)         |
| `npm run typecheck`       | Type-check without emitting                   |
| `npm run prisma:studio`   | Open Prisma Studio (DB admin UI)              |
| `npm run prisma:migrate`  | Create/apply a dev migration                  |
| `npm run prisma:seed`     | Seed the database                             |
| `npm run db:reset`        | Drop, re-migrate and re-seed (destructive)    |
| `npm run backfill:geometry` | One-off: snap-to-roads any route missing `routeGeometry` |
| `npm run backfill:i18n`   | One-off: copy legacy English text into the new `*En` per-language columns |
| `npm test`                | Jest (unit + integration against local Postgres) |

## Environment variables

See [`.env.example`](.env.example). Summary:

| Variable             | Description                                         |
|----------------------|-----------------------------------------------------|
| `DATABASE_URL`       | PostgreSQL connection string (pooled, for the app)  |
| `DIRECT_URL`         | Unpooled connection string, used by `prisma migrate deploy` (matters on Neon/pgbouncer; can equal `DATABASE_URL` for local dev) |
| `JWT_ACCESS_SECRET`  | Secret for short-lived access tokens                |
| `JWT_REFRESH_SECRET` | Secret for long-lived refresh tokens                |
| `JWT_ACCESS_TTL`     | Access token lifetime (default `15m`)               |
| `JWT_REFRESH_TTL`    | Refresh token lifetime (default `30d`)              |
| `PORT`               | HTTP port (default `4000`, this repo runs it on `4001` locally) |
| `CORS_ORIGIN`        | Comma-separated allowed origins, or `*`             |
| `NODE_ENV`           | `development` \| `test` \| `production`             |

The server validates env on boot (`src/config/env.ts`) and exits with a clear
message if anything required is missing.

## Architecture

```
src/
├── index.ts            # bootstrap: connect DB, start server, graceful shutdown
├── app.ts              # express app: middleware + router mount
├── config/env.ts       # zod-validated environment
├── lib/prisma.ts       # Prisma client singleton
├── middleware/         # auth (JWT + roles), validate (zod), error (central)
├── utils/              # AppError, asyncHandler, jwt, geo (Haversine), respond
├── schemas/            # zod request schemas per resource
├── services/           # business logic + Prisma access (thin controllers)
├── controllers/        # request/response glue
└── routes/             # express routers, wiring middleware → controllers
```

Conventions: controllers stay thin, all business logic lives in services.

## Response format

Every response uses one of two envelopes:

```jsonc
// success
{ "data": { /* ... */ } }

// error
{ "error": { "code": "VALIDATION_ERROR", "message": "Validation failed",
             "details": [ { "path": "email", "message": "Invalid email address" } ] } }
```

Common error codes: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`,
`CONFLICT`, `VALIDATION_ERROR`, `DATABASE_ERROR`, `INTERNAL_ERROR`.

## API endpoints

Base path: `/api`. 🔒 = requires `Authorization: Bearer <accessToken>`,
👑 = requires an `ADMIN` user.

### Auth
| Method | Path              | Notes                                  |
|--------|-------------------|----------------------------------------|
| POST   | `/auth/register`  | `{ email, password, name }` → tokens   |
| POST   | `/auth/login`     | `{ email, password }` → tokens         |
| POST   | `/auth/refresh`   | `{ refreshToken }` → new tokens        |
| GET    | `/auth/me`        | 🔒 current user                        |

`register`/`login`/`refresh` return `{ user, accessToken, refreshToken }`.

### Routes
Route/checkpoint/tip text fields (`title`, `description`, `region`,
`country`, checkpoint `name`, tip `text`) are stored per-language and
returned as `{ ru, en, kk }` objects; only `ru` is required, `en`/`kk`
default to empty until filled in via the admin panel.

| Method | Path                              | Notes                              |
|--------|-----------------------------------|------------------------------------|
| GET    | `/routes?category=&difficulty=&region=&country=` | public list (summaries + rating aggregate) |
| GET    | `/routes/:id`                     | public detail (pathPoints, routeGeometry, checkpoints, tips) |
| GET    | `/routes/countries?lang=`         | public, localized country names for the filter |
| POST   | `/routes`                         | 🔒👑 full create (route + checkpoints[] + tips[] + routeGeometry) |
| PUT    | `/routes/:id`                     | 🔒👑 full replace (transactional wipe+recreate) |
| PATCH  | `/routes/:id`                     | 🔒👑 partial update                |
| DELETE | `/routes/:id`                     | 🔒👑 delete (cascades)             |

### Checkpoints
| Method | Path                              | Notes                |
|--------|-----------------------------------|----------------------|
| GET    | `/routes/:routeId/checkpoints`    | public, ordered, includes `qrCode` |
| POST   | `/checkpoints`                    | 🔒👑 create (mints a stable `qrCode`) |
| PATCH  | `/checkpoints/:id`                | 🔒👑 update          |

### Tips
| Method | Path                              | Notes                |
|--------|-----------------------------------|----------------------|
| GET    | `/routes/:routeId/tips`           | public               |
| POST   | `/tips`                           | 🔒👑 create          |

### Progress / Navigation
Checkpoints are marked by **scanning a QR code**, not GPS proximity — the
scan endpoint validates the code, records it, and awards XP idempotently
(a rescan gives +0). This all works offline-first on the client (mobile
queues start/scan/complete locally on a network error and replays on
reconnect); server-side per-checkpoint uniqueness makes replayed syncs safe.

| Method | Path                              | Notes                                  |
|--------|------------------------------------|-----------------------------------------|
| POST   | `/routes/:id/start`               | 🔒 start (or resume active) session, returns `reachedOrderIndices` |
| GET    | `/progress`                       | 🔒 current user's sessions             |
| PATCH  | `/progress/:id/log`               | 🔒 append `{ points: [...] }`          |
| PATCH  | `/progress/:id/scan`              | 🔒 `{ qrCode }` → records scan, awards XP, returns checkpoint + xp + level |
| PATCH  | `/progress/:id/complete`          | 🔒 finish, freeze stats                |
| GET    | `/progress/levels`                | 🔒 per-country XP/level/rank list      |
| GET    | `/progress/achievements`          | 🔒 derived badge list (routes/distance/checkpoints/countries) |
| GET    | `/progress/leaderboard?period=`   | 🔒 top 50 by XP (`all` or `month`) + caller's own row |

### Reviews
| Method | Path                              | Notes                          |
|--------|-----------------------------------|----------------------------------|
| GET    | `/routes/:id/reviews`             | optional auth — `{summary, mine, reviews}` |
| PUT    | `/routes/:id/reviews`             | 🔒 upsert `{ rating: 1-5, comment? }` |
| DELETE | `/routes/:id/reviews`             | 🔒 remove your review          |

### Users / Friends
| Method | Path                              | Notes                          |
|--------|-----------------------------------|----------------------------------|
| GET    | `/users/:id/profile`              | public profile — only ever `hidden:false` + completed sessions |
| POST   | `/friends/:userId`                | 🔒 send/auto-accept-on-mutual friend request |
| GET    | `/friends`                        | 🔒 friends + incoming requests |
| DELETE | `/friends/:userId`                | 🔒 remove                      |

### Images
| Method | Path                              | Notes                          |
|--------|-----------------------------------|----------------------------------|
| POST   | `/images`                         | 🔒👑 upload (base64), returns `{ id, url }` |
| GET    | `/images/:id`                     | public, year-long immutable cache |

Orphaned images (replaced/removed cover photos, checkpoint media) are
auto-deleted on route/checkpoint save.

### Forum
| Method | Path                              | Notes                |
|--------|-----------------------------------|----------------------|
| GET    | `/routes/:routeId/posts`          | public               |
| POST   | `/routes/:routeId/posts`          | 🔒 `{ title, body }` |
| GET    | `/posts/:id/comments`             | public               |
| POST   | `/posts/:id/comments`             | 🔒 `{ body }`        |
| GET    | `/posts`                          | 🔒👑 list all (moderation) |
| DELETE | `/posts/:id`                      | 🔒👑 delete post (comments cascade) |
| DELETE | `/posts/:id/comments/:commentId`  | 🔒👑 delete one comment |

### Misc
| Method | Path                              | Notes                          |
|--------|-----------------------------------|----------------------------------|
| GET    | `/app-version`                    | public — `{latestVersionCode, latestVersionName, downloadUrl, notes}`, drives the in-app update banner |
| GET    | `/admin/analytics`                | 🔒👑 totals, 30-day new/active users, top routes |

## Smoke test with curl

```bash
# login as the seeded user
TOKEN=$(curl -s -X POST http://localhost:4001/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"hiker@trailquest.app","password":"password123"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.accessToken')

# list routes
curl -s http://localhost:4001/api/routes | head -c 400

# start a route (replace ROUTE_ID from the list above)
curl -s -X POST http://localhost:4001/api/routes/ROUTE_ID/start \
  -H "Authorization: Bearer $TOKEN"
```

## Notes / future work

- Forum moderation exists (admin list/delete post, delete comment).
- `Checkpoint.altitudeM` and per-point altitude in `pathPoints` are still
  persisted so a future AR layer (geo-anchors) won't need a migration —
  `qrCode` itself is now a real, always-populated, unique field (used for
  the QR-scan checkpoint flow, not AR).
- No push notifications (needs Firebase/FCM) or password reset (needs
  SMTP) yet — both deferred pending the user's external accounts.
- See [`../docs/ADMIN_WEB_PROGRESS.md`](../docs/ADMIN_WEB_PROGRESS.md) for
  the full build history.
