import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { imageIdParamSchema, uploadImageSchema } from '../schemas/image.schema';
import * as imageController from '../controllers/image.controller';

const router = Router();

// Public: mobile clients and the admin panel just <img src=".../images/:id">.
router.get(
  '/:id',
  validate({ params: imageIdParamSchema }),
  imageController.get,
);

// Admin-only: the only writer of images is the route editor.
router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate({ body: uploadImageSchema }),
  imageController.upload,
);

export default router;
