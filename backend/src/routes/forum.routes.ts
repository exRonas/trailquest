import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { idParamSchema } from '../schemas/common.schema';
import {
  createCommentSchema,
  postCommentIdParamSchema,
  postIdParamSchema,
} from '../schemas/forum.schema';
import * as forumController from '../controllers/forum.controller';

// Mounted at /api/posts — route-scoped post listing/creation lives under
// /api/routes/:routeId/posts (see route.routes.ts).
const router = Router();

// Admin moderation: every post across every route.
router.get('/', requireAuth, requireAdmin, forumController.listAllAdmin);

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

// Admin moderation: delete a post (comments cascade) or a single comment.
router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  validate({ params: idParamSchema }),
  forumController.removePost,
);
router.delete(
  '/:id/comments/:commentId',
  requireAuth,
  requireAdmin,
  validate({ params: postCommentIdParamSchema }),
  forumController.removeComment,
);

export default router;
