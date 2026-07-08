import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { UpsertReviewInput } from '../schemas/review.schema';

const reviewAuthorSelect = {
  id: true,
  name: true,
  avatar: true,
} as const;

async function assertRouteExists(routeId: string): Promise<void> {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: { id: true },
  });
  if (!route) {
    throw AppError.notFound('Route not found');
  }
}

/**
 * Aggregate rating for a single route: average (1 decimal) + count. Used both
 * standalone and inline on the route detail. Returns 0/0 when there are none.
 */
export async function getRouteRating(
  routeId: string,
): Promise<{ average: number; count: number }> {
  const agg = await prisma.routeReview.aggregate({
    where: { routeId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const avg = agg._avg.rating ?? 0;
  return {
    average: Math.round(avg * 10) / 10,
    count: agg._count._all,
  };
}

/** Aggregate ratings for many routes at once (Explore list). Keyed by routeId. */
export async function getRatingsForRoutes(
  routeIds: string[],
): Promise<Map<string, { average: number; count: number }>> {
  const map = new Map<string, { average: number; count: number }>();
  if (routeIds.length === 0) return map;
  const grouped = await prisma.routeReview.groupBy({
    by: ['routeId'],
    where: { routeId: { in: routeIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  for (const g of grouped) {
    map.set(g.routeId, {
      average: Math.round((g._avg.rating ?? 0) * 10) / 10,
      count: g._count._all,
    });
  }
  return map;
}

/**
 * Reviews for a route (newest first) plus the aggregate and, when a user id is
 * supplied, that user's own review pulled out separately so the client can show
 * an "edit your rating" state.
 */
export async function listRouteReviews(routeId: string, userId?: string) {
  await assertRouteExists(routeId);
  const [reviews, summary] = await Promise.all([
    prisma.routeReview.findMany({
      where: { routeId },
      orderBy: { updatedAt: 'desc' },
      include: { user: { select: reviewAuthorSelect } },
    }),
    getRouteRating(routeId),
  ]);
  const mine = userId ? reviews.find((r) => r.userId === userId) ?? null : null;
  return { summary, mine, reviews };
}

/** Create or update the signed-in user's review for a route (one per user). */
export async function upsertReview(
  routeId: string,
  userId: string,
  input: UpsertReviewInput,
) {
  await assertRouteExists(routeId);
  return prisma.routeReview.upsert({
    where: { userId_routeId: { userId, routeId } },
    create: {
      routeId,
      userId,
      rating: input.rating,
      comment: input.comment,
    },
    update: {
      rating: input.rating,
      comment: input.comment,
    },
    include: { user: { select: reviewAuthorSelect } },
  });
}

/** Delete the signed-in user's own review, if any. */
export async function deleteReview(
  routeId: string,
  userId: string,
): Promise<void> {
  await prisma.routeReview.deleteMany({ where: { routeId, userId } });
}

/** Every review across every route, newest first — admin moderation list. */
export async function listAllReviewsAdmin() {
  return prisma.routeReview.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      user: { select: reviewAuthorSelect },
      route: { select: { id: true, titleRu: true, titleEn: true, titleKk: true } },
    },
  });
}

/** Delete any review by id, regardless of owner — admin moderation only. */
export async function deleteReviewAdmin(reviewId: string): Promise<void> {
  const review = await prisma.routeReview.findUnique({
    where: { id: reviewId },
    select: { id: true },
  });
  if (!review) {
    throw AppError.notFound('Review not found');
  }
  await prisma.routeReview.delete({ where: { id: reviewId } });
}
