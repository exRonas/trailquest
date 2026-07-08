import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import * as friendController from '../controllers/friend.controller';

const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user id'),
});

// All friend endpoints require an authenticated user.
const router = Router();
router.use(requireAuth);

// My friends + incoming requests.
router.get('/', friendController.list);
// Relationship with a specific user.
router.get(
  '/:userId/status',
  validate({ params: userIdParamSchema }),
  friendController.status,
);
// Send (or auto-accept) a request.
router.post(
  '/:userId',
  validate({ params: userIdParamSchema }),
  friendController.add,
);
// Accept a pending request from :userId.
router.post(
  '/:userId/accept',
  validate({ params: userIdParamSchema }),
  friendController.accept,
);
// Cancel / decline / unfriend.
router.delete(
  '/:userId',
  validate({ params: userIdParamSchema }),
  friendController.remove,
);

export default router;
