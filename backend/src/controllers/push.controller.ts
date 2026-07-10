import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/respond';
import { AppError } from '../utils/AppError';
import { registerPushToken, unregisterPushToken } from '../lib/push';

export const register = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  await registerPushToken(req.user.sub, req.body.token, req.body.platform);
  sendData(res, { ok: true });
});

export const unregister = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  await unregisterPushToken(req.body.token);
  sendData(res, { ok: true });
});
