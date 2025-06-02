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

/**
 * @swagger
 * /reports/income-vs-expenses:
 *   get:
 *     summary: Get income vs expenses report with flexible grouping and date filtering
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/StartDateParam'
 *       - $ref: '#/components/parameters/EndDateParam'
 *       - name: groupBy
 *         in: query
 *         description: Time period grouping for data aggregation
 *         required: false
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year]
 *           default: month
 *           example: month
 *     responses:
 *       200:
 *         description: Income vs expenses report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     byPeriod:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date-time
 *                             description: Period start date
 *                           formattedDate:
 *                             type: string
 *                             description: Human-readable date format
 *                           income:
 *                             type: number
 *                             format: decimal
 *                             description: Total income for the period
 *                           expenses:
 *                             type: number
 *                             format: decimal
 *                             description: Total expenses for the period
 *                           netSavings:
 *                             type: number
 *                             format: decimal
 *                             description: Net savings (income - expenses)
 *                       description: Period-by-period breakdown
 *                     totals:
 *                       type: object
 *                       properties:
 *                         income:
 *                           type: number
 *                           format: decimal
 *                           description: Total income across all periods
 *                         expenses:
 *                           type: number
 *                           format: decimal
 *                           description: Total expenses across all periods
 *                         netSavings:
 *                           type: number
 *                           format: decimal
 *                           description: Total net savings
 *                         savingsRate:
 *                           type: number
 *                           format: decimal
 *                           description: Savings rate as percentage of income
 *             example:
 *               status: success
 *               data:
 *                 byPeriod:
 *                   - date: '2023-10-01T00:00:00.000Z'
 *                     formattedDate: '2023-10'
 *                     income: 4500.00
 *                     expenses: 3200.00
 *                     netSavings: 1300.00
 *                   - date: '2023-11-01T00:00:00.000Z'
 *                     formattedDate: '2023-11'
 *                     income: 4800.00
 *                     expenses: 3400.00
 *                     netSavings: 1400.00
 *                   - date: '2023-12-01T00:00:00.000Z'
 *                     formattedDate: '2023-12'
 *                     income: 5200.00
 *                     expenses: 3800.00
 *                     netSavings: 1400.00
 *                 totals:
 *                   income: 14500.00
 *                   expenses: 10400.00
 *                   netSavings: 4100.00
 *                   savingsRate: 28.28
 *       400:
 *         description: Invalid date parameters or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               missing_dates:
 *                 summary: Missing required date parameters
 *                 value:
 *                   status: error
 *                   message: Start date and end date are required
 *                   statusCode: 400
 *               invalid_date_format:
 *                 summary: Invalid date format
 *                 value:
 *                   status: error
 *                   message: Invalid date format
 *                   statusCode: 400
 *               start_after_end:
 *                 summary: Start date after end date
 *                 value:
 *                   status: error
 *                   message: Start date must be before end date
 *                   statusCode: 400
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/income-vs-expenses', getIncomeVsExpenses);

/**
 * @swagger
 * /reports/expenses-by-category:
 *   get:
 *     summary: Get expenses breakdown by category with percentages
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/StartDateParam'
 *       - $ref: '#/components/parameters/EndDateParam'
 *     responses:
 *       200:
 *         description: Expenses by category report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             allOf:
 *                               - $ref: '#/components/schemas/Category'
 *                               - type: object
 *                                 properties:
 *                                   type:
 *                                     example: EXPENSE
 *                           total:
 *                             type: number
 *                             format: decimal
 *                             description: Total amount spent in this category
 *                           percentage:
 *                             type: number
 *                             format: decimal
 *                             description: Percentage of total expenses
 *                       description: Categories ordered by spending amount (highest first)
 *                     totalExpenses:
 *                       type: number
 *                       format: decimal
 *                       description: Sum of all expenses across categories
 *             example:
 *               status: success
 *               data:
 *                 categories:
 *                   - category:
 *                       id: 1
 *                       name: Groceries
 *                       color: '#FF5733'
 *                       icon: shopping-cart
 *                     total: 1250.75
 *                     percentage: 38.5
 *                   - category:
 *                       id: 3
 *                       name: Transportation
 *                       color: '#28A745'
 *                       icon: car
 *                     total: 850.25
 *                     percentage: 26.2
 *                   - category:
 *                       id: 5
 *                       name: Entertainment
 *                       color: '#FF9500'
 *                       icon: gamepad
 *                     total: 425.50
 *                     percentage: 13.1
 *                   - category:
 *                       id: 7
 *                       name: Utilities
 *                       color: '#007BFF'
 *                       icon: zap
 *                     total: 320.00
 *                     percentage: 9.9
 *                   - category:
 *                       id: 9
 *                       name: Healthcare
 *                       color: '#DC3545'
 *                       icon: heart
 *                     total: 402.50
 *                     percentage: 12.4
 *                 totalExpenses: 3249.00
 *       400:
 *         description: Invalid date parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/expenses-by-category', getExpensesByCategory);

/**
 * @swagger
 * /reports/monthly/{year}/{month}:
 *   get:
 *     summary: Get comprehensive monthly cash flow analysis with budget comparisons
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: year
 *         in: path
 *         required: true
 *         description: Year (4-digit)
 *         schema:
 *           type: integer
 *           minimum: 2000
 *           maximum: 3000
 *           example: 2023
 *       - name: month
 *         in: path
 *         required: true
 *         description: Month (1-12)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           example: 12
 *     responses:
 *       200:
 *         description: Monthly cash flow report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                       properties:
 *                         year:
 *                           type: integer
 *                           example: 2023
 *                         month:
 *                           type: integer
 *                           example: 12
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                           description: First day of the month
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                           description: Last day of the month
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalIncome:
 *                           type: number
 *                           format: decimal
 *                           description: Total income for the month
 *                         totalExpenses:
 *                           type: number
 *                           format: decimal
 *                           description: Total expenses for the month
 *                         netSavings:
 *                           type: number
 *                           format: decimal
 *                           description: Net savings (income - expenses)
 *                         savingsRate:
 *                           type: number
 *                           format: decimal
 *                           description: Savings rate as percentage of income
 *                     incomeByCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             $ref: '#/components/schemas/Category'
 *                           total:
 *                             type: number
 *                             format: decimal
 *                           percentage:
 *                             type: number
 *                             format: decimal
 *                       description: Income breakdown by category (sorted by amount)
 *                     expensesByCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             $ref: '#/components/schemas/Category'
 *                           total:
 *                             type: number
 *                             format: decimal
 *                           percentage:
 *                             type: number
 *                             format: decimal
 *                       description: Expense breakdown by category (sorted by amount)
 *                     budgets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           budget:
 *                             allOf:
 *                               - $ref: '#/components/schemas/Budget'
 *                               - type: object
 *                                 properties:
 *                                   Category:
 *                                     $ref: '#/components/schemas/Category'
 *                                     nullable: true
 *                           progress:
 *                             type: object
 *                             properties:
 *                               spent:
 *                                 type: number
 *                                 format: decimal
 *                                 description: Amount spent against this budget
 *                               budgetAmount:
 *                                 type: number
 *                                 format: decimal
 *                                 description: Budget limit
 *                               remainingAmount:
 *                                 type: number
 *                                 format: decimal
 *                                 description: Remaining budget (0 if exceeded)
 *                               percentage:
 *                                 type: number
 *                                 format: decimal
 *                                 description: Percentage of budget used
 *                               status:
 *                                 type: string
 *                                 enum: [within_budget, warning, exceeded]
 *                       description: Budget performance for the month
 *                     transactions:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Transaction'
 *                           - type: object
 *                             properties:
 *                               Category:
 *                                 $ref: '#/components/schemas/Category'
 *                       description: All transactions for the month (sorted by date)
 *             example:
 *               status: success
 *               data:
 *                 period:
 *                   year: 2023
 *                   month: 12
 *                   startDate: '2023-12-01T00:00:00.000Z'
 *                   endDate: '2023-12-31T23:59:59.999Z'
 *                 summary:
 *                   totalIncome: 5200.00
 *                   totalExpenses: 3800.00
 *                   netSavings: 1400.00
 *                   savingsRate: 26.92
 *                 incomeByCategory:
 *                   - category:
 *                       id: 2
 *                       name: Salary
 *                       color: '#28A745'
 *                       icon: dollar-sign
 *                     total: 4500.00
 *                     percentage: 86.54
 *                   - category:
 *                       id: 4
 *                       name: Freelance
 *                       color: '#6C757D'
 *                       icon: briefcase
 *                     total: 700.00
 *                     percentage: 13.46
 *                 expensesByCategory:
 *                   - category:
 *                       id: 1
 *                       name: Groceries
 *                       color: '#FF5733'
 *                       icon: shopping-cart
 *                     total: 1250.75
 *                     percentage: 32.92
 *                   - category:
 *                       id: 3
 *                       name: Transportation
 *                       color: '#007BFF'
 *                       icon: car
 *                     total: 850.25
 *                     percentage: 22.38
 *                   - category:
 *                       id: 5
 *                       name: Entertainment
 *                       color: '#FF9500'
 *                       icon: gamepad
 *                     total: 425.50
 *                     percentage: 11.20
 *                 budgets:
 *                   - budget:
 *                       id: 1
 *                       name: Monthly Groceries
 *                       amount: 1300.00
 *                       period: monthly
 *                       categoryId: 1
 *                       Category:
 *                         id: 1
 *                         name: Groceries
 *                         color: '#FF5733'
 *                     progress:
 *                       spent: 1250.75
 *                       budgetAmount: 1300.00
 *                       remainingAmount: 49.25
 *                       percentage: 96.21
 *                       status: warning
 *                   - budget:
 *                       id: 2
 *                       name: Overall Monthly Budget
 *                       amount: 4000.00
 *                       period: monthly
 *                       categoryId: null
 *                       Category: null
 *                     progress:
 *                       spent: 3800.00
 *                       budgetAmount: 4000.00
 *                       remainingAmount: 200.00
 *                       percentage: 95.0
 *                       status: warning
 *       400:
 *         description: Invalid year or month parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example:
 *               status: error
 *               message: Invalid year or month
 *               statusCode: 400
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/monthly/:year/:month', getMonthlyCashFlow);

/**
 * @swagger
 * /reports/annual/{year}:
 *   get:
 *     summary: Get comprehensive annual financial report with month-by-month breakdown
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: year
 *         in: path
 *         required: true
 *         description: Year for the annual report (4-digit)
 *         schema:
 *           type: integer
 *           minimum: 2000
 *           maximum: 3000
 *           example: 2023
 *     responses:
 *       200:
 *         description: Annual report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     year:
 *                       type: integer
 *                       example: 2023
 *                       description: Report year
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalIncome:
 *                           type: number
 *                           format: decimal
 *                           description: Total income for the year
 *                         totalExpenses:
 *                           type: number
 *                           format: decimal
 *                           description: Total expenses for the year
 *                         totalNetSavings:
 *                           type: number
 *                           format: decimal
 *                           description: Total net savings for the year
 *                         annualSavingsRate:
 *                           type: number
 *                           format: decimal
 *                           description: Annual savings rate as percentage
 *                     monthlyData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: integer
 *                             description: Month number (1-12)
 *                           monthName:
 *                             type: string
 *                             description: Month name (January, February, etc.)
 *                           income:
 *                             type: number
 *                             format: decimal
 *                             description: Income for this month
 *                           expenses:
 *                             type: number
 *                             format: decimal
 *                             description: Expenses for this month
 *                           netSavings:
 *                             type: number
 *                             format: decimal
 *                             description: Net savings for this month
 *                           savingsRate:
 *                             type: number
 *                             format: decimal
 *                             description: Savings rate percentage for this month
 *                       description: Month-by-month breakdown for the entire year
 *                     incomeByCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             $ref: '#/components/schemas/Category'
 *                           total:
 *                             type: number
 *                             format: decimal
 *                             description: Total income from this category for the year
 *                           percentage:
 *                             type: number
 *                             format: decimal
 *                             description: Percentage of total annual income
 *                       description: Annual income breakdown by category
 *                     expensesByCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             $ref: '#/components/schemas/Category'
 *                           total:
 *                             type: number
 *                             format: decimal
 *                             description: Total expenses in this category for the year
 *                           percentage:
 *                             type: number
 *                             format: decimal
 *                             description: Percentage of total annual expenses
 *                       description: Annual expense breakdown by category
 *             example:
 *               status: success
 *               data:
 *                 year: 2023
 *                 summary:
 *                   totalIncome: 58400.00
 *                   totalExpenses: 42300.00
 *                   totalNetSavings: 16100.00
 *                   annualSavingsRate: 27.57
 *                 monthlyData:
 *                   - month: 1
 *                     monthName: January
 *                     income: 4800.00
 *                     expenses: 3500.00
 *                     netSavings: 1300.00
 *                     savingsRate: 27.08
 *                   - month: 2
 *                     monthName: February
 *                     income: 4800.00
 *                     expenses: 3200.00
 *                     netSavings: 1600.00
 *                     savingsRate: 33.33
 *                   - month: 12
 *                     monthName: December
 *                     income: 5200.00
 *                     expenses: 3800.00
 *                     netSavings: 1400.00
 *                     savingsRate: 26.92
 *                 incomeByCategory:
 *                   - category:
 *                       id: 2
 *                       name: Salary
 *                       color: '#28A745'
 *                       icon: dollar-sign
 *                     total: 50400.00
 *                     percentage: 86.30
 *                   - category:
 *                       id: 4
 *                       name: Freelance
 *                       color: '#6C757D'
 *                       icon: briefcase
 *                     total: 8000.00
 *                     percentage: 13.70
 *                 expensesByCategory:
 *                   - category:
 *                       id: 1
 *                       name: Groceries
 *                       color: '#FF5733'
 *                       icon: shopping-cart
 *                     total: 14250.00
 *                     percentage: 33.69
 *                   - category:
 *                       id: 3
 *                       name: Transportation
 *                       color: '#007BFF'
 *                       icon: car
 *                     total: 10200.00
 *                     percentage: 24.11
 *                   - category:
 *                       id: 5
 *                       name: Entertainment
 *                       color: '#FF9500'
 *                       icon: gamepad
 *                     total: 5100.00
 *                     percentage: 12.06
 *       400:
 *         description: Invalid year parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example:
 *               status: error
 *               message: Invalid year
 *               statusCode: 400
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/annual/:year', getAnnualReport);

/**
 * @swagger
 * /reports/trends:
 *   get:
 *     summary: Get financial trend analysis with predictive insights
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: months
 *         in: query
 *         description: Number of months to analyze (1-36)
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 36
 *           default: 6
 *           example: 12
 *       - name: categoryId
 *         in: query
 *         description: Analyze trends for specific category only
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Trend analysis generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                       properties:
 *                         months:
 *                           type: integer
 *                           example: 12
 *                           description: Number of months analyzed
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                           description: Analysis start date
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                           description: Analysis end date (current date)
 *                     monthly:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                             format: date-time
 *                             description: Month start date
 *                           year:
 *                             type: integer
 *                             description: Year
 *                           monthName:
 *                             type: string
 *                             description: Month name
 *                           formattedMonth:
 *                             type: string
 *                             example: '2023-12'
 *                             description: Formatted month string
 *                           income:
 *                             type: number
 *                             format: decimal
 *                             description: Income for this month
 *                           expenses:
 *                             type: number
 *                             format: decimal
 *                             description: Expenses for this month
 *                           netSavings:
 *                             type: number
 *                             format: decimal
 *                             description: Net savings for this month
 *                           savingsRate:
 *                             type: number
 *                             format: decimal
 *                             description: Savings rate percentage
 *                       description: Month-by-month data for trend analysis
 *                     trends:
 *                       type: object
 *                       properties:
 *                         income:
 *                           type: object
 *                           properties:
 *                             trend:
 *                               type: string
 *                               enum: [increasing, decreasing, stable]
 *                               description: Income trend direction
 *                             percentage:
 *                               type: number
 *                               format: decimal
 *                               description: Percentage change from first to last month
 *                         expenses:
 *                           type: object
 *                           properties:
 *                             trend:
 *                               type: string
 *                               enum: [increasing, decreasing, stable]
 *                               description: Expense trend direction
 *                             percentage:
 *                               type: number
 *                               format: decimal
 *                               description: Percentage change from first to last month
 *                         savings:
 *                           type: object
 *                           properties:
 *                             trend:
 *                               type: string
 *                               enum: [increasing, decreasing, stable]
 *                               description: Savings trend direction
 *                             percentage:
 *                               type: number
 *                               format: decimal
 *                               description: Percentage change in savings
 *                       description: Trend analysis with directional indicators
 *             example:
 *               status: success
 *               data:
 *                 period:
 *                   months: 6
 *                   startDate: '2023-07-01T00:00:00.000Z'
 *                   endDate: '2023-12-31T23:59:59.999Z'
 *                 monthly:
 *                   - month: '2023-07-01T00:00:00.000Z'
 *                     year: 2023
 *                     monthName: July
 *                     formattedMonth: '2023-07'
 *                     income: 4200.00
 *                     expenses: 3100.00
 *                     netSavings: 1100.00
 *                     savingsRate: 26.19
 *                   - month: '2023-08-01T00:00:00.000Z'
 *                     year: 2023
 *                     monthName: August
 *                     formattedMonth: '2023-08'
 *                     income: 4400.00
 *                     expenses: 3200.00
 *                     netSavings: 1200.00
 *                     savingsRate: 27.27
 *                   - month: '2023-12-01T00:00:00.000Z'
 *                     year: 2023
 *                     monthName: December
 *                     formattedMonth: '2023-12'
 *                     income: 5200.00
 *                     expenses: 3800.00
 *                     netSavings: 1400.00
 *                     savingsRate: 26.92
 *                 trends:
 *                   income:
 *                     trend: increasing
 *                     percentage: 23.81
 *                   expenses:
 *                     trend: increasing
 *                     percentage: 22.58
 *                   savings:
 *                     trend: increasing
 *                     percentage: 27.27
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example:
 *               status: error
 *               message: Invalid months parameter (must be between 1-36)
 *               statusCode: 400
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/trends', getTrendAnalysis);

export default router;
