import { prisma } from '../../lib/prisma';
import { deletePostAdmin } from '../forum.service';

/**
 * Integration test against the local dev Postgres. Verifies the destructive
 * moderation path: deleting a post must cascade-delete its comments (DB-level
 * onDelete: Cascade on ForumComment.post) rather than leaving orphans.
 */

const TEST_EMAIL = '__test_forum_cascade__@trailquest.test';

async function cleanup() {
  const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (!user) return;
  await prisma.route.deleteMany({ where: { posts: { some: { userId: user.id } } } });
  await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
}

describe('deletePostAdmin', () => {
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('cascades comment deletion when the post is deleted', async () => {
    await cleanup();
    const user = await prisma.user.create({
      data: { email: TEST_EMAIL, name: 'Cascade Test', passwordHash: 'x' },
    });
    const route = await prisma.route.create({
      data: {
        category: 'SCENIC',
        difficulty: 'EASY',
        distanceKm: 1,
        estimatedMinutes: 10,
        pathPoints: [],
      },
    });
    const post = await prisma.forumPost.create({
      data: { routeId: route.id, userId: user.id, title: 'Test post', body: 'Body' },
    });
    await prisma.forumComment.createMany({
      data: [
        { postId: post.id, userId: user.id, body: 'First' },
        { postId: post.id, userId: user.id, body: 'Second' },
      ],
    });

    await deletePostAdmin(post.id);

    const remainingComments = await prisma.forumComment.count({ where: { postId: post.id } });
    const remainingPost = await prisma.forumPost.findUnique({ where: { id: post.id } });
    expect(remainingComments).toBe(0);
    expect(remainingPost).toBeNull();
  });

  it('throws for a non-existent post id', async () => {
    await expect(
      deletePostAdmin('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow();
  });
});
