import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import * as analyticsController from '../controllers/analytics.controller';

// Admin-only dashboards. Mounted at /api/admin.
const router = Router();

router.get(
  '/analytics',
  requireAuth,
  requireAdmin,
  analyticsController.overview,
);

export default router;
