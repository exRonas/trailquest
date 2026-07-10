import { Router } from 'express';
import authRoutes from './auth.routes';
import routeRoutes from './route.routes';
import checkpointRoutes from './checkpoint.routes';
import tipRoutes from './tip.routes';
import progressRoutes from './progress.routes';
import forumRoutes from './forum.routes';
import reviewRoutes from './review.routes';
import friendRoutes from './friend.routes';
import adminRoutes from './admin.routes';
import userRoutes from './user.routes';
import imageRoutes from './image.routes';
import pushRoutes from './push.routes';
import { appVersion } from '../config/appVersion';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok', timestamp: new Date().toISOString() } });
});

router.get('/app-version', (_req, res) => {
  res.json({ data: appVersion });
});

router.use('/auth', authRoutes);
router.use('/routes', routeRoutes);
router.use('/checkpoints', checkpointRoutes);
router.use('/tips', tipRoutes);
router.use('/progress', progressRoutes);
router.use('/posts', forumRoutes);
router.use('/reviews', reviewRoutes);
router.use('/friends', friendRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/images', imageRoutes);
router.use('/push', pushRoutes);

export default router;
