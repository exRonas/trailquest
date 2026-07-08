import { prisma } from '../lib/prisma';

interface LocalizedText {
  ru: string;
  en: string;
  kk: string;
}

interface RouteStatRow {
  routeId: string;
  title: LocalizedText;
  value: number;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Resolve localized titles for a set of route ids in one query. */
async function titlesFor(routeIds: string[]): Promise<Map<string, LocalizedText>> {
  if (routeIds.length === 0) return new Map();
  const routes = await prisma.route.findMany({
    where: { id: { in: routeIds } },
    select: { id: true, titleRu: true, titleEn: true, titleKk: true },
  });
  return new Map(
    routes.map((r) => [
      r.id,
      { ru: r.titleRu, en: r.titleEn, kk: r.titleKk },
    ]),
  );
}

/**
 * Aggregate metrics for the admin dashboard: headline totals, 30-day activity,
 * and the most-completed / top-rated routes. All read-only counts/groupBys —
 * cheap on the current data volume.
 */
export async function getAnalytics() {
  const since = new Date(Date.now() - THIRTY_DAYS_MS);

  const [
    users,
    routes,
    completedSessions,
    reviews,
    posts,
    friendships,
    newUsers30d,
    activeRows,
    popularGroups,
    ratingGroups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.route.count(),
    prisma.userRouteProgress.count({ where: { completedAt: { not: null } } }),
    prisma.routeReview.count(),
    prisma.forumPost.count(),
    prisma.friendship.count({ where: { status: 'ACCEPTED' } }),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.userRouteProgress.findMany({
      where: { startedAt: { gte: since } },
      distinct: ['userId'],
      select: { userId: true },
    }),
    prisma.userRouteProgress.groupBy({
      by: ['routeId'],
      where: { completedAt: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { routeId: 'desc' } },
      take: 5,
    }),
    prisma.routeReview.groupBy({
      by: ['routeId'],
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  const popularTitles = await titlesFor(popularGroups.map((g) => g.routeId));
  const popularRoutes: RouteStatRow[] = popularGroups.map((g) => ({
    routeId: g.routeId,
    title: popularTitles.get(g.routeId) ?? { ru: '', en: '', kk: '' },
    value: g._count._all,
  }));

  const ratingTitles = await titlesFor(ratingGroups.map((g) => g.routeId));
  const topRatedRoutes = ratingGroups
    .map((g) => ({
      routeId: g.routeId,
      title: ratingTitles.get(g.routeId) ?? { ru: '', en: '', kk: '' },
      value: Math.round((g._avg.rating ?? 0) * 10) / 10,
      count: g._count._all,
    }))
    .sort((x, y) => y.value - x.value)
    .slice(0, 5);

  return {
    totals: {
      users,
      routes,
      completedSessions,
      reviews,
      posts,
      friendships,
    },
    activity: {
      newUsers30d,
      activeUsers30d: activeRows.length,
    },
    popularRoutes,
    topRatedRoutes,
  };
}
