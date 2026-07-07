import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { idParamSchema } from '../schemas/common.schema';
import {
  createCheckpointSchema,
  updateCheckpointSchema,
} from '../schemas/checkpoint.schema';
import * as checkpointController from '../controllers/checkpoint.controller';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate({ body: createCheckpointSchema }),
  checkpointController.create,
);
router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate({ params: idParamSchema, body: updateCheckpointSchema }),
  checkpointController.update,
);

export default router;
