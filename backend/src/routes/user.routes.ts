import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { idParamSchema } from '../schemas/common.schema';
import * as userController from '../controllers/user.controller';

const router = Router();

router.use(requireAuth);

router.get(
  '/:id/profile',
  validate({ params: idParamSchema }),
  userController.getPublicProfile,
);

export default router;
