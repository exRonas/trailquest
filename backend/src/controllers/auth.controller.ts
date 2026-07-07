import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/respond';
import { AppError } from '../utils/AppError';
import * as authService from '../services/auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  sendData(res, result, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  sendData(res, result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refresh(req.body.refreshToken);
  sendData(res, result);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const user = await authService.getMe(req.user.sub);
  sendData(res, user);
});
