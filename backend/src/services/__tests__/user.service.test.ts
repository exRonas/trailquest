import { prisma } from '../../lib/prisma';
import { getPublicProfile } from '../user.service';

/**
 * Integration test against the local dev Postgres (see backend/.env). Exercises
 * the public-profile privacy boundary called out as the highest-value thing to
 * cover in docs/ADMIN_WEB_PROGRESS.md: a public profile must NEVER leak a
 * hidden session or an in-progress (not yet completed) one — only ever
 * `hidden: false && completedAt != null`.
 */

const TEST_EMAIL = '__test_public_profile_privacy__@trailquest.test';

async function makeRoute() {
  return prisma.route.create({
    data: {
      category: 'SCENIC',
      difficulty: 'EASY',
      distanceKm: 5,
      estimatedMinutes: 60,
      pathPoints: [],
    },
  });
}

async function cleanup(userId?: string) {
  const user = userId
    ? { id: userId }
    : await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (!user) return;
  // Cascades: UserRouteProgress -> CheckpointScan via onDelete: Cascade on User.
  await prisma.route.deleteMany({ where: { progress: { some: { userId: user.id } } } });
  await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
}

describe('getPublicProfile privacy filter', () => {
  let userId: string;

  beforeAll(async () => {
    await cleanup();
    const user = await prisma.user.create({
      data: {
        email: TEST_EMAIL,
        name: 'Privacy Test User',
        passwordHash: 'not-a-real-hash',
      },
    });
    userId = user.id;

    const [visibleRoute, hiddenRoute, inProgressRoute] = await Promise.all([
      makeRoute(),
      makeRoute(),
      makeRoute(),
    ]);

    await prisma.userRouteProgress.createMany({
      data: [
        {
          userId,
          routeId: visibleRoute.id,
          completedAt: new Date(),
          hidden: false,
          pathLog: [],
        },
        {
          userId,
          routeId: hiddenRoute.id,
          completedAt: new Date(),
          hidden: true, // must never appear
          pathLog: [],
        },
        {
          userId,
          routeId: inProgressRoute.id,
          completedAt: null, // not finished — must never appear
          hidden: false,
          pathLog: [],
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanup(userId);
    await prisma.$disconnect();
  });

  it('only returns completed, non-hidden activities', async () => {
    const profile = await getPublicProfile(userId);
    expect(profile.activities).toHaveLength(1);
    expect(profile.activities[0].hidden).toBe(false);
    expect(profile.activities[0].completedAt).not.toBeNull();
  });

  it('never exposes email or role on the public user shape', async () => {
    const profile = await getPublicProfile(userId);
    expect(profile.user).not.toHaveProperty('email');
    expect(profile.user).not.toHaveProperty('role');
    expect(profile.user).not.toHaveProperty('passwordHash');
  });

  it('aggregates stats only over the visible activity', async () => {
    const profile = await getPublicProfile(userId);
    expect(profile.stats.completedCount).toBe(1);
  });
});
