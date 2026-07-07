import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/respond';
import * as tipService from '../services/tip.service';

export const listByRoute = asyncHandler(async (req: Request, res: Response) => {
  const tips = await tipService.listTipsByRoute(req.params.routeId);
  sendData(res, tips);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const tip = await tipService.createTip(req.body);
  sendData(res, tip, 201);
});
