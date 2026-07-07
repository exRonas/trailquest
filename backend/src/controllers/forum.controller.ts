import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/respond';
import { AppError } from '../utils/AppError';
import * as forumService from '../services/forum.service';

function userId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.sub;
}

export const listPosts = asyncHandler(async (req: Request, res: Response) => {
  const posts = await forumService.listPostsByRoute(req.params.routeId);
  sendData(res, posts);
});

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await forumService.createPost(
    req.params.routeId,
    userId(req),
    req.body,
  );
  sendData(res, post, 201);
});

export const getPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await forumService.getPostById(req.params.id);
  sendData(res, post);
});

export const listComments = asyncHandler(async (req: Request, res: Response) => {
  const comments = await forumService.listComments(req.params.id);
  sendData(res, comments);
});

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await forumService.createComment(
    req.params.id,
    userId(req),
    req.body,
  );
  sendData(res, comment, 201);
});

export const listAllAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const posts = await forumService.listAllPostsAdmin();
  sendData(res, posts);
});

export const removePost = asyncHandler(async (req: Request, res: Response) => {
  await forumService.deletePostAdmin(req.params.id);
  res.status(204).send();
});

export const removeComment = asyncHandler(async (req: Request, res: Response) => {
  await forumService.deleteCommentAdmin(req.params.commentId);
  res.status(204).send();
});
