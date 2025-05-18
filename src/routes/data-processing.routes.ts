import express, { Router } from 'express';
import {
  importTransactions,
  importCategories,
  importBudgets,
  importFinancialGoals,
  exportTransactions,
  exportCategories,
  exportBudgets,
  exportFinancialGoals,
  downloadFile,
  validateImportFile,
  upload,
} from '../controllers/data-processing.controller';
import { authenticate, isVerified } from '../middlewares/auth.middleware';

const router: Router = express.Router();

router.use(authenticate);

router.post('/import/transactions', isVerified, upload.single('file'), importTransactions);
router.post('/import/categories', isVerified, upload.single('file'), importCategories);
router.post('/import/budgets', isVerified, upload.single('file'), importBudgets);
router.post('/import/goals', isVerified, upload.single('file'), importFinancialGoals);

router.post('/validate', upload.single('file'), validateImportFile);

router.get('/export/transactions', exportTransactions);
router.get('/export/categories', exportCategories);
router.get('/export/budgets', exportBudgets);
router.get('/export/goals', exportFinancialGoals);

router.get('/download/:filename', downloadFile);

export default router;
