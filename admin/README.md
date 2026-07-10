# TrailQuest Admin

Browser admin panel for creating & editing TrailQuest routes — checkpoints,
tips, an **automatic road-snapped route line** (Mapbox Directions, walking
profile), per-checkpoint **QR code generation**, **per-language (RU/EN/KK)
content editing**, image uploads, forum moderation, and an analytics
dashboard. Talks to the existing backend REST API and signs in with an admin
account.

## Setup

```bash
cd admin
npm install
cp .env.example .env     # set VITE_API_URL and VITE_MAPBOX_TOKEN
npm run dev              # http://localhost:5173
npm test                 # Vitest unit tests
```

`.env`:

```
VITE_API_URL=http://localhost:4001/api
VITE_MAPBOX_TOKEN=pk....   # same public token as mobile/.env
```

The backend must be running (`cd backend && npm run dev`, on :4001) and you sign
in with an **ADMIN** user (seeded: `admin@trailquest.app` / `password123`).

## How it works

- **Routes list** (`/`) — every route with rating, quick edit/delete.
- **Editor** (`/routes/new`, `/routes/:id`) — title/description/category/
  difficulty/country/region/cover image, plus an interactive map:
  - **Language switcher** (RU/EN/KZ): drives which language's value shows in
    Title, Description, Region, Country, every checkpoint's Name/Description,
    and every tip's Text — fill in RU for everything, switch to KZ, fill in
    KZ, switch to EN. Only `ru` is required (matches the backend schema).
  - **Waypoint tool**: click to drop the sparse route waypoints (`pathPoints`),
    drag markers to adjust, right-click a marker to delete it.
  - **Snap to roads**: calls Mapbox Directions to turn the waypoints into a dense
    street-following line (`routeGeometry`) and auto-fills distance + est. time.
  - **Checkpoint tool**: click to drop checkpoints; edit name/type/radius/
    description in the list below; drag to reposition, right-click to delete.
    Each saved checkpoint shows a **printable QR code** (name, code, "Download
    PNG") — this is what the mobile app scans to mark it reached.
  - **Tips**: add route-wide or per-checkpoint tips.
- **Save** sends one full-upsert payload to `POST /routes` (create) or
  `PUT /routes/:id` (replace). The mobile app renders `routeGeometry` when present
  (falls back to the straight `pathPoints` line for older/un-snapped routes).
- **Forum** (`/forum`) — list every post, expand comments, delete a post or a
  single comment (moderation).
- **Analytics** (`/analytics`) — totals, 30-day new/active users, most-completed
  and top-rated routes.
- Access-token auto-refresh (same single-flight pattern as mobile) so a long
  edit session doesn't 401 mid-save.

## Notes

- The road snapping happens client-side with the public Mapbox token; the backend
  just stores the resulting geometry.
- All seeded routes already have `routeGeometry` and QR codes — only needed for
  brand-new routes, or if you ever clear `routeGeometry`.
