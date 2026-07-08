import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/respond';
import { AppError } from '../utils/AppError';
import * as friendService from '../services/friend.service';

function meId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.sub;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const [friends, incoming] = await Promise.all([
    friendService.listFriends(meId(req)),
    friendService.listIncomingRequests(meId(req)),
  ]);
  sendData(res, { friends, incoming });
});

export const status = asyncHandler(async (req: Request, res: Response) => {
  const value = await friendService.getStatus(meId(req), req.params.userId);
  sendData(res, { status: value });
});

export const add = asyncHandler(async (req: Request, res: Response) => {
  await friendService.sendRequest(meId(req), req.params.userId);
  const value = await friendService.getStatus(meId(req), req.params.userId);
  sendData(res, { status: value });
});

export const accept = asyncHandler(async (req: Request, res: Response) => {
  await friendService.acceptRequest(meId(req), req.params.userId);
  sendData(res, { status: 'friends' });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await friendService.removeFriend(meId(req), req.params.userId);
  res.status(204).send();
});
