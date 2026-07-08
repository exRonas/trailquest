import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/respond';
import * as analyticsService from '../services/analytics.service';

export const overview = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getAnalytics();
  sendData(res, data);
});
