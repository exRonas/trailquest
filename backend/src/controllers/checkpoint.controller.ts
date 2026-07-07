import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/respond';
import * as checkpointService from '../services/checkpoint.service';

export const listByRoute = asyncHandler(async (req: Request, res: Response) => {
  const checkpoints = await checkpointService.listCheckpointsByRoute(
    req.params.routeId,
  );
  sendData(res, checkpoints);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const checkpoint = await checkpointService.createCheckpoint(req.body);
  sendData(res, checkpoint, 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const checkpoint = await checkpointService.updateCheckpoint(
    req.params.id,
    req.body,
  );
  sendData(res, checkpoint);
});
