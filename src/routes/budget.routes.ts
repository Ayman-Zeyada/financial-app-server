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

/**
 * @swagger
 * /budgets:
 *   get:
 *     summary: Get all budgets for authenticated user with filtering
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: active
 *         in: query
 *         description: Filter for currently active budgets only
 *         required: false
 *         schema:
 *           type: boolean
 *           example: true
 *       - name: period
 *         in: query
 *         description: Filter budgets by period
 *         required: false
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           example: monthly
 *       - name: categoryId
 *         in: query
 *         description: Filter budgets by category ID
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Budgets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Budget'
 *                       - type: object
 *                         properties:
 *                           Category:
 *                             $ref: '#/components/schemas/Category'
 *                             nullable: true
 *             example:
 *               status: success
 *               count: 2
 *               data:
 *                 - id: 1
 *                   name: Monthly Groceries
 *                   amount: 500.00
 *                   period: monthly
 *                   startDate: '2023-12-01T00:00:00.000Z'
 *                   endDate: null
 *                   userId: 1
 *                   categoryId: 1
 *                   Category:
 *                     id: 1
 *                     name: Groceries
 *                     color: '#FF5733'
 *                     icon: shopping-cart
 *                   createdAt: '2023-12-01T10:30:00.000Z'
 *                   updatedAt: '2023-12-01T10:30:00.000Z'
 *                 - id: 2
 *                   name: Overall Monthly Budget
 *                   amount: 2000.00
 *                   period: monthly
 *                   startDate: '2023-12-01T00:00:00.000Z'
 *                   endDate: null
 *                   userId: 1
 *                   categoryId: null
 *                   Category: null
 *                   createdAt: '2023-12-01T11:00:00.000Z'
 *                   updatedAt: '2023-12-01T11:00:00.000Z'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', getBudgets);

/**
 * @swagger
 * /budgets/progress:
 *   get:
 *     summary: Get progress for all active budgets
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Budget progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       budget:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Budget'
 *                           - type: object
 *                             properties:
 *                               Category:
 *                                 $ref: '#/components/schemas/Category'
 *                                 nullable: true
 *                       period:
 *                         type: object
 *                         properties:
 *                           start:
 *                             type: string
 *                             format: date-time
 *                             description: Period start date
 *                           end:
 *                             type: string
 *                             format: date-time
 *                             description: Period end date
 *                       progress:
 *                         type: object
 *                         properties:
 *                           totalSpent:
 *                             type: number
 *                             format: decimal
 *                             description: Amount spent in current period
 *                           budgetAmount:
 *                             type: number
 *                             format: decimal
 *                             description: Budget limit amount
 *                           remainingAmount:
 *                             type: number
 *                             format: decimal
 *                             description: Remaining budget (0 if exceeded)
 *                           percentage:
 *                             type: number
 *                             format: decimal
 *                             description: Percentage of budget used
 *                           status:
 *                             type: string
 *                             enum: [within_budget, warning, exceeded]
 *                             description: Budget status (warning at 80%, exceeded at 100%)
 *             example:
 *               status: success
 *               count: 2
 *               data:
 *                 - budget:
 *                     id: 1
 *                     name: Monthly Groceries
 *                     amount: 500.00
 *                     period: monthly
 *                     startDate: '2023-12-01T00:00:00.000Z'
 *                     endDate: null
 *                     categoryId: 1
 *                     Category:
 *                       id: 1
 *                       name: Groceries
 *                       color: '#FF5733'
 *                       icon: shopping-cart
 *                   period:
 *                     start: '2023-12-01T00:00:00.000Z'
 *                     end: '2023-12-31T23:59:59.999Z'
 *                   progress:
 *                     totalSpent: 425.50
 *                     budgetAmount: 500.00
 *                     remainingAmount: 74.50
 *                     percentage: 85.1
 *                     status: warning
 *                 - budget:
 *                     id: 3
 *                     name: Weekly Entertainment
 *                     amount: 100.00
 *                     period: weekly
 *                     startDate: '2023-12-04T00:00:00.000Z'
 *                     endDate: null
 *                     categoryId: 5
 *                     Category:
 *                       id: 5
 *                       name: Entertainment
 *                       color: '#FF9500'
 *                       icon: gamepad
 *                   period:
 *                     start: '2023-12-04T00:00:00.000Z'
 *                     end: '2023-12-10T23:59:59.999Z'
 *                   progress:
 *                     totalSpent: 45.00
 *                     budgetAmount: 100.00
 *                     remainingAmount: 55.00
 *                     percentage: 45.0
 *                     status: within_budget
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/progress', getAllBudgetsProgress);

/**
 * @swagger
 * /budgets:
 *   post:
 *     summary: Create a new budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - amount
 *               - period
 *               - startDate
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Monthly Groceries Budget
 *                 description: Budget name
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0.01
 *                 example: 500.00
 *                 description: Budget limit amount
 *               period:
 *                 type: string
 *                 enum: [daily, weekly, monthly, yearly]
 *                 example: monthly
 *                 description: Budget recurrence period
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: '2023-12-01T00:00:00.000Z'
 *                 description: Budget start date
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: '2024-11-30T23:59:59.999Z'
 *                 description: Budget end date (optional, null for ongoing)
 *               categoryId:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *                 description: Category ID to limit budget to (must be EXPENSE type, null for overall budget)
 *           examples:
 *             category_budget:
 *               summary: Category-specific monthly budget
 *               value:
 *                 name: Monthly Groceries Budget
 *                 amount: 500.00
 *                 period: monthly
 *                 startDate: '2023-12-01T00:00:00.000Z'
 *                 categoryId: 1
 *             overall_budget:
 *               summary: Overall spending budget
 *               value:
 *                 name: Overall Monthly Budget
 *                 amount: 2000.00
 *                 period: monthly
 *                 startDate: '2023-12-01T00:00:00.000Z'
 *                 categoryId: null
 *             weekly_budget:
 *               summary: Weekly entertainment budget
 *               value:
 *                 name: Weekly Fun Money
 *                 amount: 100.00
 *                 period: weekly
 *                 startDate: '2023-12-04T00:00:00.000Z'
 *                 categoryId: 5
 *             temporary_budget:
 *               summary: Budget with end date
 *               value:
 *                 name: Holiday Shopping Budget
 *                 amount: 1000.00
 *                 period: monthly
 *                 startDate: '2023-11-01T00:00:00.000Z'
 *                 endDate: '2023-12-31T23:59:59.999Z'
 *                 categoryId: 6
 *     responses:
 *       201:
 *         description: Budget created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Budget created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Budget'
 *       400:
 *         description: Validation error or business rule violation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               validation_error:
 *                 summary: Validation failed
 *                 value:
 *                   status: error
 *                   message: Validation failed
 *                   errors:
 *                     amount: Amount must be a positive number
 *                     period: Period must be daily, weekly, monthly, or yearly
 *               income_category:
 *                 summary: Cannot budget for income category
 *                 value:
 *                   status: error
 *                   message: Budgets can only be created for expense categories
 *                   statusCode: 400
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Category not found or doesn't belong to user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example:
 *               status: error
 *               message: Category not found or does not belong to user
 *               statusCode: 404
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', isVerified, validateBody(budgetValidation.createBudget), createBudget);

/**
 * @swagger
 * /budgets/{id}:
 *   get:
 *     summary: Get a specific budget by ID
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Budget ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Budget retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Budget'
 *                     - type: object
 *                       properties:
 *                         Category:
 *                           $ref: '#/components/schemas/Category'
 *                           nullable: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', getBudgetById);

/**
 * @swagger
 * /budgets/{id}:
 *   put:
 *     summary: Update a budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Budget ID
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Updated Monthly Groceries Budget
 *                 description: Updated budget name
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0.01
 *                 example: 600.00
 *                 description: Updated budget amount
 *               period:
 *                 type: string
 *                 enum: [daily, weekly, monthly, yearly]
 *                 example: monthly
 *                 description: Updated recurrence period
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: '2023-12-01T00:00:00.000Z'
 *                 description: Updated start date
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: null
 *                 description: Updated end date (null for ongoing)
 *               categoryId:
 *                 type: integer
 *                 nullable: true
 *                 example: 2
 *                 description: Updated category ID (must be EXPENSE type or null)
 *           examples:
 *             increase_amount:
 *               summary: Increase budget amount
 *               value:
 *                 amount: 600.00
 *             change_category:
 *               summary: Change to different expense category
 *               value:
 *                 categoryId: 3
 *             make_overall:
 *               summary: Remove category restriction
 *               value:
 *                 categoryId: null
 *             extend_budget:
 *               summary: Remove end date to make ongoing
 *               value:
 *                 endDate: null
 *     responses:
 *       200:
 *         description: Budget updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Budget updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Budget'
 *       400:
 *         description: Validation error or business rule violation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               income_category:
 *                 summary: Cannot assign income category
 *                 value:
 *                   status: error
 *                   message: Budgets can only be created for expense categories
 *                   statusCode: 400
 *               validation_error:
 *                 summary: Validation failed
 *                 value:
 *                   status: error
 *                   message: Validation failed
 *                   errors:
 *                     amount: Amount must be a positive number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Budget or category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               budget_not_found:
 *                 summary: Budget not found
 *                 value:
 *                   status: error
 *                   message: Budget not found
 *                   statusCode: 404
 *               category_not_found:
 *                 summary: Category not found
 *                 value:
 *                   status: error
 *                   message: Category not found or does not belong to user
 *                   statusCode: 404
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id', isVerified, validateBody(budgetValidation.updateBudget), updateBudget);

/**
 * @swagger
 * /budgets/{id}:
 *   delete:
 *     summary: Delete a budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Budget ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Budget deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Budget deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', isVerified, deleteBudget);

/**
 * @swagger
 * /budgets/{id}/progress:
 *   get:
 *     summary: Get detailed progress for a specific budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Budget ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Budget progress retrieved successfully
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
 *                     budget:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Budget'
 *                         - type: object
 *                           properties:
 *                             Category:
 *                               $ref: '#/components/schemas/Category'
 *                               nullable: true
 *                     period:
 *                       type: object
 *                       properties:
 *                         start:
 *                           type: string
 *                           format: date-time
 *                           description: Current period start date
 *                         end:
 *                           type: string
 *                           format: date-time
 *                           description: Current period end date
 *                     progress:
 *                       type: object
 *                       properties:
 *                         totalSpent:
 *                           type: number
 *                           format: decimal
 *                           description: Amount spent in current period
 *                         budgetAmount:
 *                           type: number
 *                           format: decimal
 *                           description: Budget limit amount
 *                         remainingAmount:
 *                           type: number
 *                           format: decimal
 *                           description: Remaining budget (0 if exceeded)
 *                         percentage:
 *                           type: number
 *                           format: decimal
 *                           description: Percentage of budget used
 *                         status:
 *                           type: string
 *                           enum: [within_budget, warning, exceeded]
 *                           description: Budget status based on thresholds
 *                     transactions:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Transaction'
 *                           - type: object
 *                             properties:
 *                               Category:
 *                                 $ref: '#/components/schemas/Category'
 *                       description: All transactions contributing to this budget in current period
 *             example:
 *               status: success
 *               data:
 *                 budget:
 *                   id: 1
 *                   name: Monthly Groceries Budget
 *                   amount: 500.00
 *                   period: monthly
 *                   startDate: '2023-12-01T00:00:00.000Z'
 *                   endDate: null
 *                   userId: 1
 *                   categoryId: 1
 *                   Category:
 *                     id: 1
 *                     name: Groceries
 *                     color: '#FF5733'
 *                     icon: shopping-cart
 *                 period:
 *                   start: '2023-12-01T00:00:00.000Z'
 *                   end: '2023-12-31T23:59:59.999Z'
 *                 progress:
 *                   totalSpent: 425.50
 *                   budgetAmount: 500.00
 *                   remainingAmount: 74.50
 *                   percentage: 85.1
 *                   status: warning
 *                 transactions:
 *                   - id: 15
 *                     amount: 125.50
 *                     description: Weekly grocery shopping
 *                     date: '2023-12-02T10:30:00.000Z'
 *                     type: EXPENSE
 *                     categoryId: 1
 *                     Category:
 *                       id: 1
 *                       name: Groceries
 *                       color: '#FF5733'
 *                       icon: shopping-cart
 *                   - id: 18
 *                     amount: 300.00
 *                     description: Monthly bulk shopping
 *                     date: '2023-12-05T14:15:00.000Z'
 *                     type: EXPENSE
 *                     categoryId: 1
 *                     Category:
 *                       id: 1
 *                       name: Groceries
 *                       color: '#FF5733'
 *                       icon: shopping-cart
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id/progress', getBudgetProgress);

export default router;
