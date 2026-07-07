import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { idParamSchema } from '../schemas/common.schema';
import {
  checkpointReachedSchema,
  completeProgressSchema,
  logPointsSchema,
  scanCheckpointSchema,
  visibilitySchema,
} from '../schemas/progress.schema';
import * as progressController from '../controllers/progress.controller';

const router = Router();

// All progress endpoints require an authenticated owner.
router.use(requireAuth);

// List the signed-in user's sessions (Profile screen).
router.get('/', progressController.listMine);
// Per-country XP/level for the signed-in user (Profile "ranks" section).
router.get('/levels', progressController.myCountryLevels);
// Overall level (total XP across countries) for the profile header.
router.get('/level', progressController.myLevel);

router.patch(
  '/:id/log',
  validate({ params: idParamSchema, body: logPointsSchema }),
  progressController.log,
);
router.patch(
  '/:id/checkpoint-reached',
  validate({ params: idParamSchema, body: checkpointReachedSchema }),
  progressController.checkpointReached,
);
router.patch(
  '/:id/scan',
  validate({ params: idParamSchema, body: scanCheckpointSchema }),
  progressController.scan,
);
router.patch(
  '/:id/complete',
  validate({ params: idParamSchema, body: completeProgressSchema }),
  progressController.complete,
);
router.patch(
  '/:id/visibility',
  validate({ params: idParamSchema, body: visibilitySchema }),
  progressController.setVisibility,
);
router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  progressController.remove,
);

export default router;
