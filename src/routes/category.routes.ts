import express, { Router } from 'express';
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryTransactions,
  bulkCreateCategories,
} from '../controllers/category.controller';
import { authenticate, isVerified } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { categoryValidation } from './validation/category.validation';

const router: Router = express.Router();

router.use(authenticate);

router.get('/', getCategories);

router.post('/', isVerified, validateBody(categoryValidation.createCategory), createCategory);

router.post(
  '/bulk',
  isVerified,
  validateBody(categoryValidation.bulkCreateCategories),
  bulkCreateCategories,
);

router.get('/:id/transactions', getCategoryTransactions);

router.get('/:id', getCategoryById);
router.put('/:id', isVerified, validateBody(categoryValidation.updateCategory), updateCategory);
router.delete('/:id', isVerified, deleteCategory);

export default router;
