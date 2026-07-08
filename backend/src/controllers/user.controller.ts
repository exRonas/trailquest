import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/respond';
import * as userService from '../services/user.service';

export const getPublicProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const profile = await userService.getPublicProfile(req.params.id);
    sendData(res, profile);
  },
);

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateMe(req.user!.sub, req.body);
  sendData(res, user);
});

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    await userService.changePassword(req.user!.sub, req.body);
    res.status(204).send();
  },
);
