# TrailQuest Admin

Browser admin panel for creating & editing TrailQuest routes — including
checkpoints, tips, and an **automatic road-snapped route line** (Mapbox
Directions, walking profile). Talks to the existing backend REST API and signs
in with an admin account.

## Setup

```bash
cd admin
npm install
cp .env.example .env     # set VITE_API_URL and VITE_MAPBOX_TOKEN
npm run dev              # http://localhost:5173
```

`.env`:

```
VITE_API_URL=http://localhost:4001/api
VITE_MAPBOX_TOKEN=pk....   # same public token as mobile/.env
```

The backend must be running (`cd backend && npm run dev`, on :4001) and you sign
in with an **ADMIN** user (seeded: `admin@trailquest.app` / `password123`).

## How it works

- **Routes list** (`/`) — every route with quick edit/delete.
- **Editor** (`/routes/new`, `/routes/:id`) — title/description/category/
  difficulty/country/region/cover image, plus an interactive map:
  - **Waypoint tool**: click to drop the sparse route waypoints (`pathPoints`),
    drag markers to adjust.
  - **Snap to roads**: calls Mapbox Directions to turn the waypoints into a dense
    street-following line (`routeGeometry`) and auto-fills distance + est. time.
  - **Checkpoint tool**: click to drop checkpoints; edit name/type/radius/
    description in the list below; drag markers to reposition.
  - **Tips**: add route-wide or per-checkpoint tips.
- **Save** sends one full-upsert payload to `POST /routes` (create) or
  `PUT /routes/:id` (replace). The mobile app renders `routeGeometry` when present
  (falls back to the straight `pathPoints` line for older/un-snapped routes).

## Notes

- The road snapping happens client-side with the public Mapbox token; the backend
  just stores the resulting geometry.
- Existing seeded routes have no `routeGeometry` yet — open each in the editor and
  hit **Snap to roads** + **Save** to give them a proper street-following line.
