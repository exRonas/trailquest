import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { idParamSchema } from '../schemas/common.schema';
import { changePasswordSchema, updateMeSchema } from '../schemas/user.schema';
import * as userController from '../controllers/user.controller';

const router = Router();

router.use(requireAuth);

router.patch(
  '/me',
  validate({ body: updateMeSchema }),
  userController.updateMe,
);

router.patch(
  '/me/password',
  validate({ body: changePasswordSchema }),
  userController.changePassword,
);

router.get(
  '/:id/profile',
  validate({ params: idParamSchema }),
  userController.getPublicProfile,
);

export default router;
