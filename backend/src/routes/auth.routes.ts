import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/register', validate({ body: registerSchema }), authController.register);
router.post('/login', validate({ body: loginSchema }), authController.login);
router.post('/refresh', validate({ body: refreshSchema }), authController.refresh);
router.get('/me', requireAuth, authController.me);
router.post(
  '/forgot-password',
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);
router.post(
  '/reset-password',
  validate({ body: resetPasswordSchema }),
  authController.resetPassword,
);

export default router;
