import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { registerPushTokenSchema, unregisterPushTokenSchema } from '../schemas/push.schema';
import * as pushController from '../controllers/push.controller';

const router = Router();

router.post(
  '/register',
  requireAuth,
  validate({ body: registerPushTokenSchema }),
  pushController.register,
);
router.post(
  '/unregister',
  requireAuth,
  validate({ body: unregisterPushTokenSchema }),
  pushController.unregister,
);

export default router;
