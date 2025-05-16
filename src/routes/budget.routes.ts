import express, { Router } from 'express';
import {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  getBudgetProgress,
  getAllBudgetsProgress,
} from '../controllers/budget.controller';
import { authenticate, isVerified } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { budgetValidation } from './validation/budget.validation';

const router: Router = express.Router();

router.use(authenticate);

router.get('/', getBudgets);

router.get('/progress', getAllBudgetsProgress);

router.post('/', isVerified, validateBody(budgetValidation.createBudget), createBudget);

router.get('/:id', getBudgetById);
router.put('/:id', isVerified, validateBody(budgetValidation.updateBudget), updateBudget);
router.delete('/:id', isVerified, deleteBudget);

router.get('/:id/progress', getBudgetProgress);

export default router;
