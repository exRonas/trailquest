import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { createCommentSchema, postIdParamSchema } from '../schemas/forum.schema';
import * as forumController from '../controllers/forum.controller';

// Mounted at /api/posts — route-scoped post listing/creation lives under
// /api/routes/:routeId/posts (see route.routes.ts).
const router = Router();

router.get(
  '/:id',
  validate({ params: postIdParamSchema }),
  forumController.getPost,
);
router.get(
  '/:id/comments',
  validate({ params: postIdParamSchema }),
  forumController.listComments,
);
router.post(
  '/:id/comments',
  requireAuth,
  validate({ params: postIdParamSchema, body: createCommentSchema }),
  forumController.createComment,
);

export default router;
