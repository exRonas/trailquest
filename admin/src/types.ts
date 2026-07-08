export type RouteCategory =
  | 'HISTORICAL'
  | 'BATTLE'
  | 'SCENIC'
  | 'GATHERING_SPOT'
  | 'MIXED';
export type Difficulty = 'EASY' | 'MODERATE' | 'HARD';
export type CheckpointType = 'HISTORICAL' | 'DANGER' | 'UPCOMING' | 'INFO';
export type TipType = 'WARNING' | 'ADVICE';

export const CATEGORIES: RouteCategory[] = [
  'HISTORICAL',
  'BATTLE',
  'SCENIC',
  'GATHERING_SPOT',
  'MIXED',
];
export const DIFFICULTIES: Difficulty[] = ['EASY', 'MODERATE', 'HARD'];
export const CHECKPOINT_TYPES: CheckpointType[] = [
  'HISTORICAL',
  'DANGER',
  'UPCOMING',
  'INFO',
];
export const TIP_TYPES: TipType[] = ['WARNING', 'ADVICE'];

export type Locale = 'ru' | 'en' | 'kk';
export const LOCALES: Locale[] = ['ru', 'en', 'kk'];
export const LOCALE_LABELS: Record<Locale, string> = {
  ru: 'RU',
  en: 'EN',
  kk: 'KZ',
};

export interface LocalizedText {
  ru: string;
  en: string;
  kk: string;
}

export function emptyLocalizedText(): LocalizedText {
  return { ru: '', en: '', kk: '' };
}

/** Best-effort display string for places that can't offer a language switcher
 *  (e.g. a map marker tooltip) — prefers ru, falls back to en, then kk. */
export function pickLocalizedText(text: LocalizedText): string {
  return text.ru || text.en || text.kk || '';
}

export interface PathPoint {
  lat: number;
  lng: number;
  altitudeM?: number;
  sequence: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
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
  rating: { average: number; count: number };
  startLat: number | null;
  startLng: number | null;
  _count: { checkpoints: number; tips: number; posts: number };
}

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
  routeGeometry: GeoPoint[] | null;
  checkpoints: Checkpoint[];
  tips: RouteTip[];
  _count: { posts: number };
}

/** What the admin editor sends to POST /routes or PUT /routes/:id. */
export interface FullRoutePayload {
  title: LocalizedText;
  description: LocalizedText;
  category: RouteCategory;
  difficulty: Difficulty;
  distanceKm: number;
  estimatedMinutes: number;
  region: LocalizedText;
  country: LocalizedText;
  coverImageUrl?: string | null;
  pathPoints: PathPoint[];
  routeGeometry?: GeoPoint[] | null;
  checkpoints: AdminCheckpoint[];
  tips: AdminTip[];
}

export interface AdminCheckpoint {
  name: LocalizedText;
  type: CheckpointType;
  lat: number;
  lng: number;
  altitudeM?: number | null;
  radiusTriggerM: number;
  description: LocalizedText;
  mediaUrl?: string | null;
  // Stable QR token; present on checkpoints already saved at least once,
  // undefined for new ones (the server mints one on save).
  qrCode?: string | null;
  orderIndex: number;
}

export interface AdminTip {
  type: TipType;
  text: LocalizedText;
  checkpointIndex?: number | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface ForumAuthor {
  id: string;
  name: string;
  avatar: string | null;
}

/** GET /posts (admin-only, every post across every route) row shape. */
export interface AdminForumPost {
  id: string;
  routeId: string;
  title: string;
  body: string;
  createdAt: string;
  user: ForumAuthor;
  route: { id: string; titleRu: string; titleEn: string; titleKk: string };
  _count: { comments: number };
}

export interface ForumComment {
  id: string;
  postId: string;
  userId: string;
  body: string;
  createdAt: string;
  user: ForumAuthor;
}

/** GET /reviews (admin-only, every review across every route) row shape. */
export interface AdminReview {
  id: string;
  routeId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: ForumAuthor;
  route: { id: string; titleRu: string; titleEn: string; titleKk: string };
}
