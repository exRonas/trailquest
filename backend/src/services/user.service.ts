import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { UpdateMeInput } from '../schemas/user.schema';

const publicUserSelect = {
  id: true,
  name: true,
  avatar: true,
  createdAt: true,
} as const;

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

function mapActivityRoute<
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
>(activity: T) {
  const { titleRu, titleEn, titleKk, regionRu, regionEn, regionKk, ...rest } =
    activity.route;
  return {
    ...activity,
    route: {
      ...rest,
      title: { ru: titleRu, en: titleEn, kk: titleKk },
      region: { ru: regionRu, en: regionEn, kk: regionKk },
    },
  };
}

/** Update the signed-in user's own editable fields (currently just avatar). */
export async function updateMe(userId: string, input: UpdateMeInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatar: input.avatar },
  });
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

/**
 * Profile any signed-in user can view about another user — e.g. tapping an
 * author's name/avatar on a forum post. Only ever exposes completed sessions
 * the owner hasn't hidden; never the email, role, or in-progress sessions.
 */
export async function getPublicProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
  if (!user) {
    throw AppError.notFound('User not found');
  }

  const rawActivities = await prisma.userRouteProgress.findMany({
    where: { userId, hidden: false, completedAt: { not: null } },
    orderBy: { completedAt: 'desc' },
    include: { route: { select: progressRouteSelect } },
  });
  const activities = rawActivities.map(mapActivityRoute);

  const stats = activities.reduce(
    (acc, a) => ({
      completedCount: acc.completedCount + 1,
      totalDistanceKm: acc.totalDistanceKm + a.totalDistanceKm,
      movingSeconds: acc.movingSeconds + a.movingSeconds,
    }),
    { completedCount: 0, totalDistanceKm: 0, movingSeconds: 0 },
  );

  return { user, stats, activities };
}
