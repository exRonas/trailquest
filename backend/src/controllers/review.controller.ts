import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/respond';
import { AppError } from '../utils/AppError';
import * as reviewService from '../services/review.service';

function userId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.sub;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await reviewService.listRouteReviews(
    req.params.routeId,
    req.user?.sub,
  );
  sendData(res, result);
});

export const upsert = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.upsertReview(
    req.params.routeId,
    userId(req),
    req.body,
  );
  sendData(res, review);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await reviewService.deleteReview(req.params.routeId, userId(req));
  res.status(204).send();
});

export const listAllAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const reviews = await reviewService.listAllReviewsAdmin();
  sendData(res, reviews);
});

export const removeAdmin = asyncHandler(async (req: Request, res: Response) => {
  await reviewService.deleteReviewAdmin(req.params.id);
  res.status(204).send();
});
