import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { createTipSchema } from '../schemas/tip.schema';
import * as tipController from '../controllers/tip.controller';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate({ body: createTipSchema }),
  tipController.create,
);

export default router;
