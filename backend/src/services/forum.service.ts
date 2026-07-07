import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { CreateCommentInput, CreatePostInput } from '../schemas/forum.schema';

const postAuthorSelect = {
  id: true,
  name: true,
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
