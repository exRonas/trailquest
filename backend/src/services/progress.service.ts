import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { summarizePathLog, PathLogPoint } from '../utils/geo';
import {
  CheckpointReachedInput,
  CompleteProgressInput,
  LogPointsInput,
} from '../schemas/progress.schema';
import { PathLogPointInput } from '../schemas/common.schema';
import {
  levelForXp,
  XP_PER_CHECKPOINT,
  XP_ROUTE_COMPLETE_BONUS,
} from '../lib/levels';
import { computeAchievements } from '../lib/achievements';

/**
 * Start a route. If the user already has an in-progress (not completed) session
 * for this route, that session is returned instead of creating a duplicate —
 * along with `reachedOrderIndices` so a resumed navigation screen can restore
 * which checkpoints were already scanned instead of showing them all as
 * unvisited again.
 */
export async function startRoute(userId: string, routeId: string) {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: { id: true },
  });
  if (!route) {
    throw AppError.notFound('Route not found');
  }

  const active = await prisma.userRouteProgress.findFirst({
    where: { userId, routeId, completedAt: null },
  });
  if (active) {
    const scans = await prisma.checkpointScan.findMany({
      where: { progressId: active.id },
      select: { checkpoint: { select: { orderIndex: true } } },
    });
    return { ...active, reachedOrderIndices: scans.map((s) => s.checkpoint.orderIndex) };
  }

  const created = await prisma.userRouteProgress.create({
    data: { userId, routeId, pathLog: [] },
  });
  return { ...created, reachedOrderIndices: [] as number[] };
}

/** Loads a session and asserts the caller owns it. */
async function getOwnedProgress(progressId: string, userId: string) {
  const progress = await prisma.userRouteProgress.findUnique({
    where: { id: progressId },
  });
  if (!progress) {
    throw AppError.notFound('Progress session not found');
  }
  if (progress.userId !== userId) {
    throw AppError.forbidden('This session belongs to another user');
  }
  return progress;
}

function readPathLog(value: Prisma.JsonValue): PathLogPoint[] {
  return Array.isArray(value) ? (value as unknown as PathLogPoint[]) : [];
}

/**
 * Append a batch of GPS samples and recompute aggregate stats so the Profile /
 * Active Navigation screens can read distance + moving time without replaying
 * the whole log client-side.
 */
export async function logPoints(
  progressId: string,
  userId: string,
  input: LogPointsInput,
) {
  const progress = await getOwnedProgress(progressId, userId);
  if (progress.completedAt) {
    throw AppError.badRequest('Cannot log points to a completed session');
  }

  const existing = readPathLog(progress.pathLog);
  const merged = [...existing, ...(input.points as PathLogPointInput[])];
  const stats = summarizePathLog(merged as PathLogPoint[]);

  return prisma.userRouteProgress.update({
    where: { id: progressId },
    data: {
      pathLog: merged as unknown as Prisma.InputJsonValue,
      totalDistanceKm: stats.totalDistanceKm,
      movingSeconds: stats.movingSeconds,
    },
  });
}

/**
 * Record reaching a checkpoint. lastCheckpointIndex only ever moves forward so
 * out-of-order or duplicate client reports can't regress progress.
 */
export async function checkpointReached(
  progressId: string,
  userId: string,
  input: CheckpointReachedInput,
) {
  const progress = await getOwnedProgress(progressId, userId);
  if (progress.completedAt) {
    throw AppError.badRequest('Cannot update a completed session');
  }

  const nextIndex = Math.max(
    progress.lastCheckpointIndex,
    input.checkpointIndex,
  );

  return prisma.userRouteProgress.update({
    where: { id: progressId },
    data: { lastCheckpointIndex: nextIndex },
  });
}

function toLocalized(ru: string, en: string, kk: string) {
  return { ru, en, kk };
}

/**
 * Scan a checkpoint's physical QR code. Validates the code belongs to a
 * checkpoint on the session's route, records the scan (idempotent per
 * checkpoint), awards XP into the route's country, and returns the localized
 * checkpoint plus updated progress/level info for the scan card.
 */
export async function scanCheckpoint(
  progressId: string,
  userId: string,
  qrCode: string,
) {
  const progress = await getOwnedProgress(progressId, userId);
  if (progress.completedAt) {
    throw AppError.badRequest('This session is already completed');
  }

  const checkpoint = await prisma.checkpoint.findUnique({
    where: { qrCode },
    include: {
      route: {
        select: {
          id: true,
          countryRu: true,
          countryEn: true,
          countryKk: true,
          _count: { select: { checkpoints: true } },
        },
      },
    },
  });
  if (!checkpoint) {
    throw AppError.badRequest('QR code not recognised');
  }
  if (checkpoint.routeId !== progress.routeId) {
    throw AppError.badRequest('This QR code belongs to a different route');
  }

  const totalCheckpoints = checkpoint.route._count.checkpoints;
  const countryKey = checkpoint.route.countryEn || 'Unknown';

  const localizedCheckpoint = {
    id: checkpoint.id,
    routeId: checkpoint.routeId,
    name: toLocalized(checkpoint.nameRu, checkpoint.nameEn, checkpoint.nameKk),
    type: checkpoint.type,
    lat: checkpoint.lat,
    lng: checkpoint.lng,
    altitudeM: checkpoint.altitudeM,
    radiusTriggerM: checkpoint.radiusTriggerM,
    description: toLocalized(
      checkpoint.descriptionRu,
      checkpoint.descriptionEn,
      checkpoint.descriptionKk,
    ),
    mediaUrl: checkpoint.mediaUrl,
    orderIndex: checkpoint.orderIndex,
  };
  const country = toLocalized(
    checkpoint.route.countryRu,
    checkpoint.route.countryEn,
    checkpoint.route.countryKk,
  );

  // Already scanned in this session? Return idempotently with no extra XP.
  const existing = await prisma.checkpointScan.findUnique({
    where: {
      progressId_checkpointId: { progressId, checkpointId: checkpoint.id },
    },
  });
  if (existing) {
    const reachedCount = await prisma.checkpointScan.count({
      where: { progressId },
    });
    const cp = await prisma.userCountryProgress.findUnique({
      where: { userId_country: { userId, country: countryKey } },
    });
    return {
      alreadyScanned: true,
      checkpoint: localizedCheckpoint,
      xpAwarded: 0,
      bonusAwarded: 0,
      reachedCount,
      totalCheckpoints,
      allScanned: reachedCount >= totalCheckpoints,
      country,
      level: levelForXp(cp?.xp ?? 0),
    };
  }

  return prisma.$transaction(async (tx) => {
    await tx.checkpointScan.create({
      data: { progressId, checkpointId: checkpoint.id },
    });

    const reachedCount = await tx.checkpointScan.count({ where: { progressId } });
    const allScanned = reachedCount >= totalCheckpoints;
    const bonusAwarded = allScanned ? XP_ROUTE_COMPLETE_BONUS : 0;
    const xpAwarded = XP_PER_CHECKPOINT + bonusAwarded;

    const updatedCountry = await tx.userCountryProgress.upsert({
      where: { userId_country: { userId, country: countryKey } },
      create: { userId, country: countryKey, xp: xpAwarded },
      update: { xp: { increment: xpAwarded } },
    });

    await tx.userRouteProgress.update({
      where: { id: progressId },
      data: {
        lastCheckpointIndex: Math.max(
          progress.lastCheckpointIndex,
          checkpoint.orderIndex,
        ),
      },
    });

    return {
      alreadyScanned: false,
      checkpoint: localizedCheckpoint,
      xpAwarded,
      bonusAwarded,
      reachedCount,
      totalCheckpoints,
      allScanned,
      country,
      level: levelForXp(updatedCountry.xp),
    };
  });
}

/**
 * Per-country XP/level list for the signed-in user (Profile "ranks" section).
 * Localized country names are resolved by joining back to the routes that
 * carry each canonical countryEn key.
 */
export async function listCountryLevels(userId: string) {
  const rows = await prisma.userCountryProgress.findMany({
    where: { userId },
    orderBy: { xp: 'desc' },
  });
  if (rows.length === 0) return [];

  // Resolve localized country names from any route in each country.
  const keys = rows.map((r) => r.country);
  const routes = await prisma.route.findMany({
    where: { countryEn: { in: keys } },
    select: { countryRu: true, countryEn: true, countryKk: true },
    distinct: ['countryEn'],
  });
  const byKey = new Map(
    routes.map((r) => [
      r.countryEn,
      toLocalized(r.countryRu, r.countryEn, r.countryKk),
    ]),
  );

  return rows.map((r) => ({
    country: byKey.get(r.country) ?? toLocalized(r.country, r.country, r.country),
    ...levelForXp(r.xp),
  }));
}

/**
 * Overall level for the signed-in user: total XP across every country,
 * resolved through the same curve. Shown under the profile name.
 */
export async function getOverallLevel(userId: string) {
  const agg = await prisma.userCountryProgress.aggregate({
    where: { userId },
    _sum: { xp: true },
  });
  return levelForXp(agg._sum.xp ?? 0);
}

/**
 * Achievement badges for the signed-in user, derived from aggregate stats
 * (see src/lib/achievements.ts) — nothing is stored, so the catalog can change
 * freely. Runs four cheap COUNT/SUM queries and maps them through the catalog.
 */
export async function getAchievements(userId: string) {
  const [routesCompleted, distanceAgg, checkpointsScanned, countries] =
    await Promise.all([
      prisma.userRouteProgress.count({
        where: { userId, completedAt: { not: null } },
      }),
      prisma.userRouteProgress.aggregate({
        where: { userId, completedAt: { not: null } },
        _sum: { totalDistanceKm: true },
      }),
      prisma.checkpointScan.count({ where: { progress: { userId } } }),
      prisma.userCountryProgress.count({ where: { userId } }),
    ]);

  return computeAchievements({
    routesCompleted,
    distanceKm: distanceAgg._sum.totalDistanceKm ?? 0,
    checkpointsScanned,
    countries,
  });
}

interface LeaderboardEntry {
  rank: number;
  user: { id: string; name: string; avatar: string | null };
  xp: number;
  level: number;
  rankName: { ru: string; en: string; kk: string };
  isMe: boolean;
}

export type LeaderboardPeriod = 'all' | 'month';

/**
 * Compute each user's score for the requested period.
 *  - 'all': the stored running XP total across every country.
 *  - 'month': XP from checkpoint scans in the last 30 days
 *    (scans × XP_PER_CHECKPOINT). Route-completion bonuses aren't stored
 *    per-scan so they're excluded — this is an "activity this month" score,
 *    not an exact XP replay.
 */
async function rankedScores(
  period: LeaderboardPeriod,
): Promise<{ userId: string; xp: number }[]> {
  if (period === 'month') {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const scans = await prisma.checkpointScan.findMany({
      where: { scannedAt: { gte: since } },
      select: { progress: { select: { userId: true } } },
    });
    const byUser = new Map<string, number>();
    for (const s of scans) {
      const uid = s.progress.userId;
      byUser.set(uid, (byUser.get(uid) ?? 0) + XP_PER_CHECKPOINT);
    }
    return [...byUser.entries()]
      .map(([uid, xp]) => ({ userId: uid, xp }))
      .filter((r) => r.xp > 0)
      .sort((a, b) => b.xp - a.xp);
  }

  const sums = await prisma.userCountryProgress.groupBy({
    by: ['userId'],
    _sum: { xp: true },
  });
  return sums
    .map((s) => ({ userId: s.userId, xp: s._sum.xp ?? 0 }))
    .filter((r) => r.xp > 0)
    .sort((a, b) => b.xp - a.xp);
}

/**
 * Global leaderboard for a period. Returns the top N plus, when the caller
 * isn't in that top slice, their own entry appended so they can always see
 * where they stand. The userbase is small (test app) so the full ranking is
 * computed in memory rather than paginating in SQL.
 */
export async function getLeaderboard(
  userId: string,
  period: LeaderboardPeriod = 'all',
  limit = 50,
): Promise<{ top: LeaderboardEntry[]; me: LeaderboardEntry | null }> {
  const ranked = await rankedScores(period);

  const myIndex = ranked.findIndex((r) => r.userId === userId);
  const topSlice = ranked.slice(0, limit);

  // Fetch display info for everyone we're about to return (top slice + me).
  const idsToFetch = new Set(topSlice.map((r) => r.userId));
  if (myIndex >= 0) idsToFetch.add(userId);
  const idList = [...idsToFetch];
  const [users, allTimeSums] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: idList } },
      select: { id: true, name: true, avatar: true },
    }),
    // Level/rank always reflects all-time XP so a monthly board doesn't demote
    // a veteran to "Novice"; the row's `xp` still shows the period score.
    prisma.userCountryProgress.groupBy({
      by: ['userId'],
      where: { userId: { in: idList } },
      _sum: { xp: true },
    }),
  ]);
  const userById = new Map(users.map((u) => [u.id, u]));
  const allTimeById = new Map(
    allTimeSums.map((s) => [s.userId, s._sum.xp ?? 0]),
  );

  const toEntry = (
    row: { userId: string; xp: number },
    index: number,
  ): LeaderboardEntry => {
    const u = userById.get(row.userId);
    const level = levelForXp(allTimeById.get(row.userId) ?? 0);
    return {
      rank: index + 1,
      user: {
        id: row.userId,
        name: u?.name ?? '—',
        avatar: u?.avatar ?? null,
      },
      xp: row.xp,
      level: level.level,
      rankName: level.rank,
      isMe: row.userId === userId,
    };
  };

  const top = topSlice.map((row, i) => toEntry(row, i));
  const me =
    myIndex >= 0 && myIndex >= limit
      ? toEntry(ranked[myIndex], myIndex)
      : null;

  return { top, me };
}

/**
 * Complete a route, optionally flushing a final batch of points, and freeze the
 * aggregate stats.
 */
export async function completeRoute(
  progressId: string,
  userId: string,
  input: CompleteProgressInput,
) {
  const progress = await getOwnedProgress(progressId, userId);
  if (progress.completedAt) {
    throw AppError.badRequest('Session is already completed');
  }

  const existing = readPathLog(progress.pathLog);
  const merged = input.points
    ? [...existing, ...(input.points as PathLogPointInput[])]
    : existing;
  const stats = summarizePathLog(merged as PathLogPoint[]);

  return prisma.userRouteProgress.update({
    where: { id: progressId },
    data: {
      completedAt: new Date(),
      pathLog: merged as unknown as Prisma.InputJsonValue,
      totalDistanceKm: stats.totalDistanceKm,
      movingSeconds: stats.movingSeconds,
    },
  });
}

/** Toggle whether a session is hidden from public/shared views. */
export async function setProgressVisibility(
  progressId: string,
  userId: string,
  hidden: boolean,
) {
  await getOwnedProgress(progressId, userId);
  return prisma.userRouteProgress.update({
    where: { id: progressId },
    data: { hidden },
  });
}

/** Permanently delete one of the user's own sessions. */
export async function deleteProgress(
  progressId: string,
  userId: string,
): Promise<void> {
  await getOwnedProgress(progressId, userId);
  await prisma.userRouteProgress.delete({ where: { id: progressId } });
}

const progressRouteSelect = {
  id: true,
  titleRu: true,
  titleEn: true,
  titleKk: true,
  regionRu: true,
  regionEn: true,
  regionKk: true,
  category: true,
  difficulty: true,
  distanceKm: true,
  coverImageUrl: true,
} as const;

function mapProgressRoute<
  T extends {
    route: {
      titleRu: string;
      titleEn: string;
      titleKk: string;
      regionRu: string;
      regionEn: string;
      regionKk: string;
    };
  },
>(progress: T) {
  const { titleRu, titleEn, titleKk, regionRu, regionEn, regionKk, ...rest } =
    progress.route;
  return {
    ...progress,
    route: {
      ...rest,
      title: { ru: titleRu, en: titleEn, kk: titleKk },
      region: { ru: regionRu, en: regionEn, kk: regionKk },
    },
  };
}

/** All sessions for a user (Profile screen), newest first, with route summary. */
export async function listUserProgress(userId: string) {
  const sessions = await prisma.userRouteProgress.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    include: { route: { select: progressRouteSelect } },
  });
  return sessions.map(mapProgressRoute);
}
