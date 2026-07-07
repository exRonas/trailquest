# TrailQuest — Backend API

REST API for the TrailQuest hiking-route navigator: auth, routes, geo-checkpoints,
route tips, navigation progress tracking, and a per-route forum.

**Stack:** Node.js · Express · TypeScript (strict) · PostgreSQL · Prisma · JWT · Zod

---

## Prerequisites

- Node.js 18+ (built and tested on Node 22/24)
- A PostgreSQL 13+ database (local install, Docker, or a hosted instance)

> No PostGIS required — geo math (Haversine distance, radius checks, speed) is
> done in application code (`src/utils/geo.ts`).

## Quick start

```bash
cd backend

# 1. Install deps
npm install

# 2. Configure environment
cp .env.example .env
#   then edit .env — at minimum set DATABASE_URL and the two JWT secrets

# 3. Create the schema + tables
npx prisma migrate dev --name init

# 4. Seed sample data (4 real routes, checkpoints, tips, users, a forum thread)
npx prisma db seed

# 5. Run the dev server (auto-reload)
npm run dev
# → http://localhost:4000  (health: GET /api/health)
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

## Environment variables

See [`.env.example`](.env.example). Summary:

| Variable             | Description                                         |
|----------------------|-----------------------------------------------------|
| `DATABASE_URL`       | PostgreSQL connection string                        |
| `JWT_ACCESS_SECRET`  | Secret for short-lived access tokens                |
| `JWT_REFRESH_SECRET` | Secret for long-lived refresh tokens                |
| `JWT_ACCESS_TTL`     | Access token lifetime (default `15m`)               |
| `JWT_REFRESH_TTL`    | Refresh token lifetime (default `30d`)              |
| `PORT`               | HTTP port (default `4000`)                           |
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
| Method | Path                              | Notes                              |
|--------|-----------------------------------|------------------------------------|
| GET    | `/routes?category=&difficulty=&region=` | public list (summaries)      |
| GET    | `/routes/:id`                     | public detail (path, checkpoints, tips) |
| POST   | `/routes`                         | 🔒👑 create                        |
| PATCH  | `/routes/:id`                     | 🔒👑 update                        |
| DELETE | `/routes/:id`                     | 🔒👑 delete (cascades)             |

### Checkpoints
| Method | Path                              | Notes                |
|--------|-----------------------------------|----------------------|
| GET    | `/routes/:routeId/checkpoints`    | public, ordered      |
| POST   | `/checkpoints`                    | 🔒👑 create          |
| PATCH  | `/checkpoints/:id`                | 🔒👑 update          |

### Tips
| Method | Path                              | Notes                |
|--------|-----------------------------------|----------------------|
| GET    | `/routes/:routeId/tips`           | public               |
| POST   | `/tips`                           | 🔒👑 create          |

### Progress / Navigation
| Method | Path                                  | Notes                                  |
|--------|---------------------------------------|----------------------------------------|
| POST   | `/routes/:id/start`                   | 🔒 start (or resume active) session    |
| GET    | `/progress`                           | 🔒 current user's sessions             |
| PATCH  | `/progress/:id/log`                   | 🔒 append `{ points: [...] }`          |
| PATCH  | `/progress/:id/checkpoint-reached`    | 🔒 `{ checkpointIndex }`               |
| PATCH  | `/progress/:id/complete`              | 🔒 finish, freeze stats                |

### Forum
| Method | Path                              | Notes                |
|--------|-----------------------------------|----------------------|
| GET    | `/routes/:routeId/posts`          | public               |
| POST   | `/routes/:routeId/posts`          | 🔒 `{ title, body }` |
| GET    | `/posts/:id/comments`             | public               |
| POST   | `/posts/:id/comments`             | 🔒 `{ body }`        |

## Smoke test with curl

```bash
# login as the seeded user
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"hiker@trailquest.app","password":"password123"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.accessToken')

# list routes
curl -s http://localhost:4000/api/routes | head -c 400

# start a route (replace ROUTE_ID from the list above)
curl -s -X POST http://localhost:4000/api/routes/ROUTE_ID/start \
  -H "Authorization: Bearer $TOKEN"
```

## Notes / future work

- Forum has no moderation in v1 (planned for Phase 1.5 with the admin panel).
- `Checkpoint.altitudeM` / `qrCode` and per-point altitude in `pathPoints` are
  persisted now so the Phase-2 AR layer (geo-anchors) won't need a migration.
