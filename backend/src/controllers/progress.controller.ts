import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/respond';
import { AppError } from '../utils/AppError';
import * as progressService from '../services/progress.service';

function userId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.sub;
}

export const start = asyncHandler(async (req: Request, res: Response) => {
  const progress = await progressService.startRoute(userId(req), req.params.id);
  sendData(res, progress, 201);
});

export const log = asyncHandler(async (req: Request, res: Response) => {
  const progress = await progressService.logPoints(
    req.params.id,
    userId(req),
    req.body,
  );
  sendData(res, progress);
});

export const checkpointReached = asyncHandler(
  async (req: Request, res: Response) => {
    const progress = await progressService.checkpointReached(
      req.params.id,
      userId(req),
      req.body,
    );
    sendData(res, progress);
  },
);

export const scan = asyncHandler(async (req: Request, res: Response) => {
  const result = await progressService.scanCheckpoint(
    req.params.id,
    userId(req),
    req.body.qrCode,
  );
  sendData(res, result);
});

export const myCountryLevels = asyncHandler(
  async (req: Request, res: Response) => {
    const levels = await progressService.listCountryLevels(userId(req));
    sendData(res, levels);
  },
);

export const myLevel = asyncHandler(async (req: Request, res: Response) => {
  const level = await progressService.getOverallLevel(userId(req));
  sendData(res, level);
});

export const myAchievements = asyncHandler(
  async (req: Request, res: Response) => {
    const achievements = await progressService.getAchievements(userId(req));
    sendData(res, achievements);
  },
);

export const leaderboard = asyncHandler(async (req: Request, res: Response) => {
  const period = req.query.period === 'month' ? 'month' : 'all';
  const board = await progressService.getLeaderboard(userId(req), period);
  sendData(res, board);
});

export const complete = asyncHandler(async (req: Request, res: Response) => {
  const progress = await progressService.completeRoute(
    req.params.id,
    userId(req),
    req.body,
  );
  sendData(res, progress);
});

export const setVisibility = asyncHandler(
  async (req: Request, res: Response) => {
    const progress = await progressService.setProgressVisibility(
      req.params.id,
      userId(req),
      req.body.hidden,
    );
    sendData(res, progress);
  },
);

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await progressService.deleteProgress(req.params.id, userId(req));
  res.status(204).send();
});

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const sessions = await progressService.listUserProgress(userId(req));
  sendData(res, sessions);
});
