/**
 * Achievements are *derived* from a user's aggregate stats on read — there is
 * no award table and nothing to migrate or reconcile. Adding/retuning a badge
 * is a code change only. Each badge unlocks when a single metric crosses a
 * threshold; `progress` (0..1) drives a progress bar on locked badges.
 *
 * Metric-per-badge (rather than arbitrary predicates) keeps the progress
 * calculation trivial and the catalog easy to read.
 */

export interface LocalizedText {
  ru: string;
  en: string;
  kk: string;
}

export type AchievementMetric =
  | 'routesCompleted'
  | 'distanceKm'
  | 'checkpointsScanned'
  | 'countries';

export interface AchievementStats {
  routesCompleted: number;
  distanceKm: number;
  checkpointsScanned: number;
  countries: number;
}

export interface AchievementDef {
  id: string;
  /** MaterialCommunityIcons glyph name (rendered on mobile). */
  icon: string;
  metric: AchievementMetric;
  threshold: number;
  title: LocalizedText;
  description: LocalizedText;
}

/** Ordered catalog. Grouped by metric, ascending threshold within a group. */
export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Routes completed ──
  {
    id: 'first_route',
    icon: 'flag-checkered',
    metric: 'routesCompleted',
    threshold: 1,
    title: { ru: 'Первый маршрут', en: 'First Trail', kk: 'Алғашқы маршрут' },
    description: {
      ru: 'Завершите свой первый маршрут',
      en: 'Complete your first route',
      kk: 'Алғашқы маршрутты аяқтаңыз',
    },
  },
  {
    id: 'five_routes',
    icon: 'map-marker-path',
    metric: 'routesCompleted',
    threshold: 5,
    title: { ru: 'Бывалый', en: 'Regular', kk: 'Тәжірибелі' },
    description: {
      ru: 'Завершите 5 маршрутов',
      en: 'Complete 5 routes',
      kk: '5 маршрутты аяқтаңыз',
    },
  },
  {
    id: 'twenty_routes',
    icon: 'trophy',
    metric: 'routesCompleted',
    threshold: 20,
    title: { ru: 'Ветеран троп', en: 'Trail Veteran', kk: 'Соқпақ ардагері' },
    description: {
      ru: 'Завершите 20 маршрутов',
      en: 'Complete 20 routes',
      kk: '20 маршрутты аяқтаңыз',
    },
  },
  // ── Distance ──
  {
    id: 'distance_10',
    icon: 'shoe-print',
    metric: 'distanceKm',
    threshold: 10,
    title: { ru: '10 километров', en: '10 Kilometers', kk: '10 шақырым' },
    description: {
      ru: 'Пройдите суммарно 10 км',
      en: 'Walk 10 km in total',
      kk: 'Барлығы 10 км жүріңіз',
    },
  },
  {
    id: 'distance_50',
    icon: 'map-marker-distance',
    metric: 'distanceKm',
    threshold: 50,
    title: { ru: 'Марафонец', en: 'Long Hauler', kk: 'Марафоншы' },
    description: {
      ru: 'Пройдите суммарно 50 км',
      en: 'Walk 50 km in total',
      kk: 'Барлығы 50 км жүріңіз',
    },
  },
  {
    id: 'distance_100',
    icon: 'road-variant',
    metric: 'distanceKm',
    threshold: 100,
    title: { ru: 'Сотня', en: 'Centurion', kk: 'Жүздік' },
    description: {
      ru: 'Пройдите суммарно 100 км',
      en: 'Walk 100 km in total',
      kk: 'Барлығы 100 км жүріңіз',
    },
  },
  // ── Checkpoints scanned ──
  {
    id: 'checkpoints_10',
    icon: 'qrcode-scan',
    metric: 'checkpointsScanned',
    threshold: 10,
    title: { ru: 'Исследователь', en: 'Explorer', kk: 'Зерттеуші' },
    description: {
      ru: 'Отсканируйте 10 точек',
      en: 'Scan 10 checkpoints',
      kk: '10 нүктені сканерлеңіз',
    },
  },
  {
    id: 'checkpoints_50',
    icon: 'compass-rose',
    metric: 'checkpointsScanned',
    threshold: 50,
    title: { ru: 'Следопыт', en: 'Pathfinder', kk: 'Ізшіл' },
    description: {
      ru: 'Отсканируйте 50 точек',
      en: 'Scan 50 checkpoints',
      kk: '50 нүктені сканерлеңіз',
    },
  },
  // ── Countries ──
  {
    id: 'countries_2',
    icon: 'earth',
    metric: 'countries',
    threshold: 2,
    title: { ru: 'Путешественник', en: 'Globetrotter', kk: 'Саяхатшы' },
    description: {
      ru: 'Пройдите маршруты в 2 странах',
      en: 'Hike routes in 2 countries',
      kk: '2 елде маршрут жүріңіз',
    },
  },
];

export interface AchievementView extends AchievementDef {
  unlocked: boolean;
  /** Current metric value, clamped display uses threshold. */
  current: number;
  /** 0..1 toward the threshold (1 when unlocked). */
  progress: number;
}

/** Resolve every badge's unlocked state + progress for the given stats. */
export function computeAchievements(
  stats: AchievementStats,
): AchievementView[] {
  return ACHIEVEMENTS.map((a) => {
    const current = stats[a.metric];
    const unlocked = current >= a.threshold;
    const progress = a.threshold > 0 ? Math.min(1, current / a.threshold) : 0;
    return { ...a, unlocked, current, progress };
  });
}
