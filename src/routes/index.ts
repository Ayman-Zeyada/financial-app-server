import express, { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import transactionRoutes from './transaction.routes';
import categoryRoutes from './category.routes';
import budgetRoutes from './budget.routes';
import reportRoutes from './report.routes';
import financialGoalRoutes from './financial-goal.routes';
import dataProcessingRoutes from './data-processing.routes';

const router: Router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/transactions', transactionRoutes);
router.use('/categories', categoryRoutes);
router.use('/budgets', budgetRoutes);
router.use('/goals', financialGoalRoutes);
router.use('/reports', reportRoutes);
router.use('/data', dataProcessingRoutes);

export default router;
