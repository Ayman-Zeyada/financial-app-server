import express, { Router } from 'express';
import authRoutes from './auth.routes';

const router: Router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.use('/auth', authRoutes);

export default router;