import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/respond';
import { AppError } from '../utils/AppError';
import * as imageService from '../services/image.service';

export const upload = asyncHandler(async (req: Request, res: Response) => {
  const image = await imageService.saveImage(req.body);
  const url = `${req.protocol}://${req.get('host')}/api/images/${image.id}`;
  sendData(res, { id: image.id, url }, 201);
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const image = await imageService.getImage(req.params.id);
  if (!image) {
    throw AppError.notFound('Image not found');
  }
  res.set('Content-Type', image.mimeType);
  // Uploaded images are immutable — a replaced image gets a new id, the old
  // row is deleted — so browsers/CDNs can cache this response forever.
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  // Helmet's default same-origin CORP would block the admin panel (a
  // different Render origin) from rendering these in an <img> tag.
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.send(image.data);
});
