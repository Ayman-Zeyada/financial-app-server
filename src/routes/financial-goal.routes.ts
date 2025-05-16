import express, { Router } from 'express';
import {
  createFinancialGoal,
  getUserFinancialGoals,
  getFinancialGoalById,
  updateFinancialGoal,
  updateGoalProgress,
  deleteFinancialGoal,
} from '../controllers/financial-goal.controller';
import { authenticate, isVerified } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { financialGoalValidation } from './validation/financial-goal.validation';

const router: Router = express.Router();

router.use(authenticate);

router.get('/', getUserFinancialGoals);

router.post(
  '/',
  isVerified,
  validateBody(financialGoalValidation.createFinancialGoal),
  createFinancialGoal,
);

router.get('/:id', getFinancialGoalById);

router.put(
  '/:id',
  isVerified,
  validateBody(financialGoalValidation.updateFinancialGoal),
  updateFinancialGoal,
);

router.patch(
  '/:id/progress',
  isVerified,
  validateBody(financialGoalValidation.updateGoalProgress),
  updateGoalProgress,
);

router.delete('/:id', isVerified, deleteFinancialGoal);

export default router;
