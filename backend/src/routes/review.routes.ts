import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { idParamSchema } from '../schemas/common.schema';
import * as reviewController from '../controllers/review.controller';

// Mounted at /api/reviews — admin moderation across every route's reviews.
// Per-route read/write for the signed-in user lives under
// /api/routes/:routeId/reviews (see route.routes.ts).
const router = Router();

router.get('/', requireAuth, requireAdmin, reviewController.listAllAdmin);
router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  validate({ params: idParamSchema }),
  reviewController.removeAdmin,
);

export default router;
