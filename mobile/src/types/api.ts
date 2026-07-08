/** Mirrors the backend Prisma enums and response shapes. */

export type Role = 'USER' | 'ADMIN';
export type RouteCategory =
  | 'HISTORICAL'
  | 'BATTLE'
  | 'SCENIC'
  | 'GATHERING_SPOT'
  | 'MIXED';
export type Difficulty = 'EASY' | 'MODERATE' | 'HARD';
export type CheckpointType = 'HISTORICAL' | 'DANGER' | 'UPCOMING' | 'INFO';
export type TipType = 'WARNING' | 'ADVICE';

/** Per-language text returned by the backend for route/checkpoint/tip
 *  content. `en` and `kk` may be empty if not yet translated via the admin
 *  panel — pick with `pickLocalized()` from `../i18n`, which falls back to
 *  `ru` then `en`. */
export interface LocalizedText {
  ru: string;
  en: string;
  kk: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Preset avatar id ("<icon>-<colorIndex>"), or null for initials. */
  avatar: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PathPoint {
  lat: number;
  lng: number;
  altitudeM?: number;
  sequence: number;
}

export interface Checkpoint {
  id: string;
  routeId: string;
  name: LocalizedText;
  type: CheckpointType;
  lat: number;
  lng: number;
  altitudeM: number | null;
  radiusTriggerM: number;
  description: LocalizedText;
  mediaUrl: string | null;
  qrCode: string | null;
  orderIndex: number;
}

export interface RouteTip {
  id: string;
  routeId: string;
  checkpointId: string | null;
  type: TipType;
  text: LocalizedText;
}

/** Lightweight list item from GET /routes. */
export interface RouteSummary {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  category: RouteCategory;
  difficulty: Difficulty;
  distanceKm: number;
  estimatedMinutes: number;
  region: LocalizedText;
  country: LocalizedText;
  coverImageUrl: string | null;
  createdAt: string;
  /** Representative map coordinate (first path point); null if unavailable. */
  startLat: number | null;
  startLng: number | null;
  _count: { checkpoints: number; tips: number; posts: number };
}

/** One entry of GET /routes/countries. */
export interface CountryOption {
  country: string;
  routeCount: number;
}

/** Full detail from GET /routes/:id. */
export interface RouteDetail {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  category: RouteCategory;
  difficulty: Difficulty;
  distanceKm: number;
  estimatedMinutes: number;
  region: LocalizedText;
  country: LocalizedText;
  coverImageUrl: string | null;
  createdAt: string;
  pathPoints: PathPoint[];
  /** Dense road-following line [{lat,lng}] if the route has been snapped to
   *  streets in the admin panel; null for older routes (fall back to pathPoints). */
  routeGeometry: { lat: number; lng: number }[] | null;
  checkpoints: Checkpoint[];
  tips: RouteTip[];
  _count: { posts: number };
}

export interface PathLogPoint {
  lat: number;
  lng: number;
  speedKmh?: number;
  timestamp: string;
}

export interface UserRouteProgress {
  id: string;
  userId: string;
  routeId: string;
  startedAt: string;
  completedAt: string | null;
  hidden: boolean;
  lastCheckpointIndex: number;
  totalDistanceKm: number;
  movingSeconds: number;
  pathLog: PathLogPoint[];
  /** Only present on the POST /routes/:id/start response. */
  reachedOrderIndices?: number[];
}

export interface ProgressWithRoute extends UserRouteProgress {
  route: {
    id: string;
    title: LocalizedText;
    region: LocalizedText;
    category: RouteCategory;
    difficulty: Difficulty;
    distanceKm: number;
    coverImageUrl: string | null;
  };
}

export interface PostAuthor {
  id: string;
  name: string;
  avatar: string | null;
}

/** GET /users/:id/profile — another user's public profile. Only ever includes
 *  their completed, non-hidden activities (never in-progress or hidden ones). */
export interface PublicProfile {
  user: { id: string; name: string; avatar: string | null; createdAt: string };
  stats: {
    completedCount: number;
    totalDistanceKm: number;
    movingSeconds: number;
  };
  activities: ProgressWithRoute[];
}

export interface ForumPost {
  id: string;
  routeId: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  user: PostAuthor;
  _count: { comments: number };
}

export interface ForumComment {
  id: string;
  postId: string;
  userId: string;
  body: string;
  createdAt: string;
  user: PostAuthor;
}

export interface RouteFilters {
  category?: RouteCategory;
  difficulty?: Difficulty;
  region?: string;
  country?: string;
}

/** Per-language XP/level info (mirrors backend src/lib/levels.ts). */
export interface LevelInfo {
  level: number;
  rank: LocalizedText;
  xp: number;
  xpIntoLevel: number;
  /** XP span of the current level, or null at max level. */
  xpForNextLevel: number | null;
  /** 0..1 progress to next level. */
  progress: number;
}

/** One country's level row from GET /progress/levels. */
export interface CountryLevel extends LevelInfo {
  country: LocalizedText;
}

/** The checkpoint as returned by the scan endpoint (no qrCode echoed back). */
export interface ScannedCheckpoint {
  id: string;
  routeId: string;
  name: LocalizedText;
  type: CheckpointType;
  lat: number;
  lng: number;
  altitudeM: number | null;
  radiusTriggerM: number;
  description: LocalizedText;
  mediaUrl: string | null;
  orderIndex: number;
}

/** Result of PATCH /progress/:id/scan. */
export interface ScanResult {
  alreadyScanned: boolean;
  checkpoint: ScannedCheckpoint;
  xpAwarded: number;
  bonusAwarded: number;
  reachedCount: number;
  totalCheckpoints: number;
  allScanned: boolean;
  country: LocalizedText;
  level: LevelInfo;
  /** True when scanned with no connection — queued locally, XP/level here are
   *  placeholders until offlineQueue syncs it and the server computes the
   *  real numbers. */
  pending?: boolean;
}

/** Backend error envelope. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
  };
}

export interface AppVersionInfo {
  latestVersionCode: number;
  latestVersionName: string;
  downloadUrl: string;
  notes: string;
}
