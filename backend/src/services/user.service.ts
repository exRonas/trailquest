import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { BCRYPT_ROUNDS } from './auth.service';
import { ChangePasswordInput, UpdateMeInput } from '../schemas/user.schema';

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

/** Update the signed-in user's own editable fields (name and/or avatar). */
export async function updateMe(userId: string, input: UpdateMeInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.avatar !== undefined ? { avatar: input.avatar } : null),
      ...(input.name !== undefined ? { name: input.name } : null),
    },
  });
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

/**
 * Change the signed-in user's password. Requires the current password to
 * match — this endpoint is reachable by anyone holding a valid access token,
 * so a stolen/left-open session alone must not be enough to lock the real
 * owner out.
 */
export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound('User not found');
  }
  const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!ok) {
    throw AppError.unauthorized('Current password is incorrect');
  }
  const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
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
