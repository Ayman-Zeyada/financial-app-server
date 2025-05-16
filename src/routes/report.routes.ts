import express, { Router } from 'express';
import {
  getIncomeVsExpenses,
  getExpensesByCategory,
  getMonthlyCashFlow,
  getAnnualReport,
  getTrendAnalysis,
} from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router: Router = express.Router();

router.use(authenticate);

router.get('/income-vs-expenses', getIncomeVsExpenses);

router.get('/expenses-by-category', getExpensesByCategory);

router.get('/monthly/:year/:month', getMonthlyCashFlow);

router.get('/annual/:year', getAnnualReport);

router.get('/trends', getTrendAnalysis);

export default router;
