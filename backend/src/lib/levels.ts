/**
 * Per-country XP / level model. Level is always derived from XP (never stored),
 * so the curve can be retuned without a data migration.
 *
 * Levels 0..10. Rank names are localized (ru/en/kk) and resolved client-side
 * the same way route content is.
 */

export const XP_PER_CHECKPOINT = 50;
/** Extra XP granted the moment the final checkpoint of a route is scanned. */
export const XP_ROUTE_COMPLETE_BONUS = 100;

export const MAX_LEVEL = 10;

/**
 * Cumulative XP required to *reach* each level. Index == level.
 * Gentle rising curve — each level costs a bit more than the last.
 */
export const LEVEL_THRESHOLDS = [
  0, // 0
  100, // 1
  250, // 2
  450, // 3
  700, // 4
  1000, // 5
  1400, // 6
  1900, // 7
  2500, // 8
  3200, // 9
  4000, // 10
] as const;

export interface LocalizedText {
  ru: string;
  en: string;
  kk: string;
}

/** Rank name per level (index == level), localized. */
export const RANKS: LocalizedText[] = [
  { ru: 'Новичок', en: 'Novice', kk: 'Жаңадан бастаушы' }, // 0
  { ru: 'Турист', en: 'Tourist', kk: 'Турист' }, // 1
  { ru: 'Ходок', en: 'Walker', kk: 'Жаяу жүруші' }, // 2
  { ru: 'Следопыт', en: 'Pathfinder', kk: 'Ізшіл' }, // 3
  { ru: 'Походник', en: 'Hiker', kk: 'Жорықшы' }, // 4
  { ru: 'Знаток троп', en: 'Trail Expert', kk: 'Соқпақ білгірі' }, // 5
  { ru: 'Опытный путник', en: 'Seasoned Trekker', kk: 'Тәжірибелі жолаушы' }, // 6
  { ru: 'Мастер маршрутов', en: 'Route Master', kk: 'Маршрут шебері' }, // 7
  { ru: 'Покоритель', en: 'Conqueror', kk: 'Бағындырушы' }, // 8
  { ru: 'Легенда троп', en: 'Trail Legend', kk: 'Соқпақ аңызы' }, // 9
  { ru: 'Профессионал', en: 'Professional', kk: 'Кәсіпқой' }, // 10
];

export interface LevelInfo {
  /** 0..MAX_LEVEL */
  level: number;
  rank: LocalizedText;
  /** Total XP accumulated. */
  xp: number;
  /** XP earned since reaching the current level. */
  xpIntoLevel: number;
  /** XP span of the current level (current→next), or null at max level. */
  xpForNextLevel: number | null;
  /** 0..1 progress to the next level (1 at max level). */
  progress: number;
}

/** Resolve the full level/rank breakdown for a given XP total. */
export function levelForXp(xp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(xp));
  let level = 0;
  for (let i = 0; i <= MAX_LEVEL; i += 1) {
    if (safeXp >= LEVEL_THRESHOLDS[i]) {
      level = i;
    } else {
      break;
    }
  }
  const base = LEVEL_THRESHOLDS[level];
  const xpIntoLevel = safeXp - base;
  if (level >= MAX_LEVEL) {
    return {
      level,
      rank: RANKS[level],
      xp: safeXp,
      xpIntoLevel,
      xpForNextLevel: null,
      progress: 1,
    };
  }
  const span = LEVEL_THRESHOLDS[level + 1] - base;
  return {
    level,
    rank: RANKS[level],
    xp: safeXp,
    xpIntoLevel,
    xpForNextLevel: span,
    progress: span > 0 ? xpIntoLevel / span : 0,
  };
}
