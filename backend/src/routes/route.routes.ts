import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth, requireAdmin } from '../middleware/auth';
import {
  countriesQuerySchema,
  fullRouteSchema,
  routeListQuerySchema,
  updateRouteSchema,
} from '../schemas/route.schema';
import { idParamSchema, routeIdParamSchema } from '../schemas/common.schema';
import {
  createPostSchema,
} from '../schemas/forum.schema';
import * as routeController from '../controllers/route.controller';
import * as checkpointController from '../controllers/checkpoint.controller';
import * as tipController from '../controllers/tip.controller';
import * as forumController from '../controllers/forum.controller';
import * as progressController from '../controllers/progress.controller';

const router = Router();

// ─── Public reads ────────────────────────────────────────────────────────────
router.get('/', validate({ query: routeListQuerySchema }), routeController.list);
// Must precede '/:id' so "countries" isn't matched as a route id.
router.get(
  '/countries',
  validate({ query: countriesQuerySchema }),
  routeController.listCountries,
);
router.get('/:id', validate({ params: idParamSchema }), routeController.getById);

router.get(
  '/:routeId/checkpoints',
  validate({ params: routeIdParamSchema }),
  checkpointController.listByRoute,
);
router.get(
  '/:routeId/tips',
  validate({ params: routeIdParamSchema }),
  tipController.listByRoute,
);
router.get(
  '/:routeId/posts',
  validate({ params: routeIdParamSchema }),
  forumController.listPosts,
);

// ─── Authenticated user actions ──────────────────────────────────────────────
router.post(
  '/:routeId/posts',
  requireAuth,
  validate({ params: routeIdParamSchema, body: createPostSchema }),
  forumController.createPost,
);
router.post(
  '/:id/start',
  requireAuth,
  validate({ params: idParamSchema }),
  progressController.start,
);

// ─── Admin-only writes ───────────────────────────────────────────────────────
router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate({ body: fullRouteSchema }),
  routeController.create,
);
router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  validate({ params: idParamSchema, body: fullRouteSchema }),
  routeController.replace,
);
router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate({ params: idParamSchema, body: updateRouteSchema }),
  routeController.update,
);
router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  validate({ params: idParamSchema }),
  routeController.remove,
);

export default router;
