import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { CreateCommentInput, CreatePostInput } from '../schemas/forum.schema';

const postAuthorSelect = {
  id: true,
  name: true,
  avatar: true,
} as const;

export async function listPostsByRoute(routeId: string) {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: { id: true },
  });
  if (!route) {
    throw AppError.notFound('Route not found');
  }
  return prisma.forumPost.findMany({
    where: { routeId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: postAuthorSelect },
      _count: { select: { comments: true } },
    },
  });
}

export async function createPost(
  routeId: string,
  userId: string,
  input: CreatePostInput,
) {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: { id: true },
  });
  if (!route) {
    throw AppError.notFound('Route not found');
  }
  return prisma.forumPost.create({
    data: {
      routeId,
      userId,
      title: input.title,
      body: input.body,
    },
    include: {
      user: { select: postAuthorSelect },
      _count: { select: { comments: true } },
    },
  });
}

export async function getPostById(postId: string) {
  const post = await prisma.forumPost.findUnique({
    where: { id: postId },
    include: {
      user: { select: postAuthorSelect },
      _count: { select: { comments: true } },
    },
  });
  if (!post) {
    throw AppError.notFound('Post not found');
  }
  return post;
}

export async function listComments(postId: string) {
  const post = await prisma.forumPost.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) {
    throw AppError.notFound('Post not found');
  }
  return prisma.forumComment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: postAuthorSelect } },
  });
}

export async function createComment(
  postId: string,
  userId: string,
  input: CreateCommentInput,
) {
  const post = await prisma.forumPost.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) {
    throw AppError.notFound('Post not found');
  }
  return prisma.forumComment.create({
    data: { postId, userId, body: input.body },
    include: { user: { select: postAuthorSelect } },
  });
}

/** Every post across every route, newest first — admin moderation list. */
export async function listAllPostsAdmin() {
  return prisma.forumPost.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: postAuthorSelect },
      route: { select: { id: true, titleRu: true, titleEn: true, titleKk: true } },
      _count: { select: { comments: true } },
    },
  });
}

/**
 * Delete a post. Comments cascade at the DB level (ForumComment.post has
 * onDelete: Cascade) so the thread can never be left with orphaned replies.
 */
export async function deletePostAdmin(postId: string) {
  const post = await prisma.forumPost.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) {
    throw AppError.notFound('Post not found');
  }
  await prisma.forumPost.delete({ where: { id: postId } });
}

/** Delete a single comment without touching the rest of the thread. */
export async function deleteCommentAdmin(commentId: string) {
  const comment = await prisma.forumComment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });
  if (!comment) {
    throw AppError.notFound('Comment not found');
  }
  await prisma.forumComment.delete({ where: { id: commentId } });
}
