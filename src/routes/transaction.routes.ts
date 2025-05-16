import express, { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  bulkCreateTransactions,
  getRecurringTransactions,
} from '../controllers/transaction.controller';
import { authenticate, isVerified } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { transactionValidation } from './validation/transaction.validation';

const router: Router = express.Router();

router.use(authenticate);

router.get('/', getTransactions);

router.get('/recurring', getRecurringTransactions);

router.post(
  '/',
  isVerified,
  validateBody(transactionValidation.createTransaction),
  createTransaction,
);

router.post(
  '/bulk',
  isVerified,
  validateBody(transactionValidation.bulkCreateTransactions),
  bulkCreateTransactions,
);

router.get('/:id', getTransactionById);
router.put(
  '/:id',
  isVerified,
  validateBody(transactionValidation.updateTransaction),
  updateTransaction,
);
router.delete('/:id', isVerified, deleteTransaction);

export default router;
