import express, { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

const router: Router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;
