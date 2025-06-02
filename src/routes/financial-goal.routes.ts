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

/**
 * @swagger
 * /goals:
 *   get:
 *     summary: Get all financial goals for authenticated user with progress tracking
 *     tags: [Financial Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial goals retrieved successfully with progress calculations
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
 *                     type: object
 *                     properties:
 *                       goal:
 *                         $ref: '#/components/schemas/FinancialGoal'
 *                       progress:
 *                         type: object
 *                         properties:
 *                           currentAmount:
 *                             type: number
 *                             format: decimal
 *                             description: Current saved amount
 *                           targetAmount:
 *                             type: number
 *                             format: decimal
 *                             description: Target goal amount
 *                           percentage:
 *                             type: number
 *                             format: decimal
 *                             description: Completion percentage (0-100+)
 *                           remaining:
 *                             type: number
 *                             format: decimal
 *                             description: Amount still needed (0 if achieved)
 *                           isAchieved:
 *                             type: boolean
 *                             description: Whether the goal has been reached
 *                           estimatedCompletion:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: Estimated completion date based on savings trend
 *             example:
 *               status: success
 *               count: 3
 *               data:
 *                 - goal:
 *                     id: 1
 *                     name: Emergency Fund
 *                     targetAmount: 10000.00
 *                     currentAmount: 2500.00
 *                     targetDate: '2024-12-31T23:59:59.999Z'
 *                     description: Save for unexpected expenses
 *                     category: Savings
 *                     notificationSent: false
 *                     userId: 1
 *                     createdAt: '2023-10-01T10:30:00.000Z'
 *                     updatedAt: '2023-12-07T14:20:00.000Z'
 *                   progress:
 *                     currentAmount: 2500.00
 *                     targetAmount: 10000.00
 *                     percentage: 25.0
 *                     remaining: 7500.00
 *                     isAchieved: false
 *                     estimatedCompletion: '2024-10-15T00:00:00.000Z'
 *                 - goal:
 *                     id: 2
 *                     name: Vacation Fund
 *                     targetAmount: 3000.00
 *                     currentAmount: 3200.00
 *                     targetDate: '2024-06-01T00:00:00.000Z'
 *                     description: Summer vacation to Europe
 *                     category: Travel
 *                     notificationSent: true
 *                     userId: 1
 *                     createdAt: '2023-08-15T09:00:00.000Z'
 *                     updatedAt: '2023-11-28T16:45:00.000Z'
 *                   progress:
 *                     currentAmount: 3200.00
 *                     targetAmount: 3000.00
 *                     percentage: 106.7
 *                     remaining: 0
 *                     isAchieved: true
 *                     estimatedCompletion: null
 *                 - goal:
 *                     id: 3
 *                     name: New Car Down Payment
 *                     targetAmount: 5000.00
 *                     currentAmount: 800.00
 *                     targetDate: '2024-08-01T00:00:00.000Z'
 *                     description: Down payment for new vehicle
 *                     category: Transportation
 *                     notificationSent: false
 *                     userId: 1
 *                     createdAt: '2023-11-01T12:00:00.000Z'
 *                     updatedAt: '2023-12-05T18:30:00.000Z'
 *                   progress:
 *                     currentAmount: 800.00
 *                     targetAmount: 5000.00
 *                     percentage: 16.0
 *                     remaining: 4200.00
 *                     isAchieved: false
 *                     estimatedCompletion: '2024-09-12T00:00:00.000Z'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', getUserFinancialGoals);

/**
 * @swagger
 * /goals:
 *   post:
 *     summary: Create a new financial goal
 *     tags: [Financial Goals]
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
 *               - targetAmount
 *               - targetDate
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Emergency Fund
 *                 description: Goal name (1-100 characters)
 *               targetAmount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0.01
 *                 example: 10000.00
 *                 description: Target amount to save (must be positive)
 *               currentAmount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 default: 0
 *                 example: 500.00
 *                 description: Starting amount already saved (defaults to 0)
 *               targetDate:
 *                 type: string
 *                 format: date-time
 *                 example: '2024-12-31T23:59:59.999Z'
 *                 description: Target completion date (must be in the future)
 *               description:
 *                 type: string
 *                 maxLength: 200
 *                 example: Save for unexpected expenses and financial security
 *                 description: Optional goal description
 *               category:
 *                 type: string
 *                 maxLength: 50
 *                 example: Savings
 *                 description: Optional goal category for organization
 *           examples:
 *             emergency_fund:
 *               summary: Emergency fund goal
 *               value:
 *                 name: Emergency Fund
 *                 targetAmount: 10000.00
 *                 targetDate: '2024-12-31T23:59:59.999Z'
 *                 description: Save for unexpected expenses and financial security
 *                 category: Savings
 *             vacation_goal:
 *               summary: Vacation savings goal
 *               value:
 *                 name: Europe Vacation
 *                 targetAmount: 3000.00
 *                 currentAmount: 200.00
 *                 targetDate: '2024-06-01T00:00:00.000Z'
 *                 description: Summer vacation to Europe
 *                 category: Travel
 *             car_down_payment:
 *               summary: Car down payment goal
 *               value:
 *                 name: New Car Down Payment
 *                 targetAmount: 5000.00
 *                 targetDate: '2024-08-01T00:00:00.000Z'
 *                 description: Down payment for new vehicle
 *                 category: Transportation
 *             wedding_fund:
 *               summary: Wedding savings with initial amount
 *               value:
 *                 name: Wedding Fund
 *                 targetAmount: 15000.00
 *                 currentAmount: 1500.00
 *                 targetDate: '2025-05-15T00:00:00.000Z'
 *                 description: Save for wedding expenses
 *                 category: Life Events
 *     responses:
 *       201:
 *         description: Financial goal created successfully
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
 *                   example: Financial goal created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     goal:
 *                       $ref: '#/components/schemas/FinancialGoal'
 *                     progress:
 *                       type: object
 *                       properties:
 *                         currentAmount:
 *                           type: number
 *                           example: 0
 *                         targetAmount:
 *                           type: number
 *                           example: 10000.00
 *                         percentage:
 *                           type: number
 *                           example: 0
 *                         remaining:
 *                           type: number
 *                           example: 10000.00
 *                         isAchieved:
 *                           type: boolean
 *                           example: false
 *                         estimatedCompletion:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             examples:
 *               validation_failed:
 *                 summary: Validation errors
 *                 value:
 *                   status: error
 *                   message: Validation failed
 *                   errors:
 *                     targetAmount: Target amount must be a positive number
 *                     targetDate: Target date must be in the future
 *               past_target_date:
 *                 summary: Target date in the past
 *                 value:
 *                   status: error
 *                   message: Validation failed
 *                   errors:
 *                     targetDate: Target date must be in the future
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/',
  isVerified,
  validateBody(financialGoalValidation.createFinancialGoal),
  createFinancialGoal,
);

/**
 * @swagger
 * /goals/{id}:
 *   get:
 *     summary: Get a specific financial goal by ID with progress details
 *     tags: [Financial Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Financial goal ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Financial goal retrieved successfully
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
 *                     goal:
 *                       $ref: '#/components/schemas/FinancialGoal'
 *                     progress:
 *                       type: object
 *                       properties:
 *                         currentAmount:
 *                           type: number
 *                           format: decimal
 *                           example: 2500.00
 *                         targetAmount:
 *                           type: number
 *                           format: decimal
 *                           example: 10000.00
 *                         percentage:
 *                           type: number
 *                           format: decimal
 *                           example: 25.0
 *                           description: Completion percentage
 *                         remaining:
 *                           type: number
 *                           format: decimal
 *                           example: 7500.00
 *                           description: Amount still needed
 *                         isAchieved:
 *                           type: boolean
 *                           example: false
 *                           description: Whether goal is completed
 *                         estimatedCompletion:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: '2024-10-15T00:00:00.000Z'
 *                           description: Estimated completion based on savings trend
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', getFinancialGoalById);

/**
 * @swagger
 * /goals/{id}:
 *   put:
 *     summary: Update a financial goal
 *     tags: [Financial Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Financial goal ID
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
 *                 example: Updated Emergency Fund
 *                 description: Updated goal name
 *               targetAmount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0.01
 *                 example: 12000.00
 *                 description: Updated target amount
 *               currentAmount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 example: 3000.00
 *                 description: Updated current amount
 *               targetDate:
 *                 type: string
 *                 format: date-time
 *                 example: '2025-06-30T23:59:59.999Z'
 *                 description: Updated target date (must be in future)
 *               description:
 *                 type: string
 *                 maxLength: 200
 *                 example: Updated description for emergency savings
 *                 description: Updated goal description
 *               category:
 *                 type: string
 *                 maxLength: 50
 *                 example: Emergency Savings
 *                 description: Updated goal category
 *           examples:
 *             increase_target:
 *               summary: Increase target amount
 *               value:
 *                 targetAmount: 12000.00
 *             update_progress:
 *               summary: Update current amount
 *               value:
 *                 currentAmount: 3500.00
 *             extend_deadline:
 *               summary: Extend target date
 *               value:
 *                 targetDate: '2025-06-30T23:59:59.999Z'
 *             complete_update:
 *               summary: Update all fields
 *               value:
 *                 name: Enhanced Emergency Fund
 *                 targetAmount: 15000.00
 *                 currentAmount: 4000.00
 *                 targetDate: '2025-12-31T23:59:59.999Z'
 *                 description: Larger emergency fund for better security
 *                 category: Financial Security
 *     responses:
 *       200:
 *         description: Financial goal updated successfully
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
 *                   example: Financial goal updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     goal:
 *                       $ref: '#/components/schemas/FinancialGoal'
 *                     progress:
 *                       type: object
 *                       properties:
 *                         currentAmount:
 *                           type: number
 *                           example: 3000.00
 *                         targetAmount:
 *                           type: number
 *                           example: 12000.00
 *                         percentage:
 *                           type: number
 *                           example: 25.0
 *                         remaining:
 *                           type: number
 *                           example: 9000.00
 *                         isAchieved:
 *                           type: boolean
 *                           example: false
 *                         estimatedCompletion:
 *                           type: string
 *                           nullable: true
 *                           example: '2025-03-15T00:00:00.000Z'
 *                     wasAchieved:
 *                       type: boolean
 *                       example: false
 *                       description: Whether the goal was just achieved with this update
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put(
  '/:id',
  isVerified,
  validateBody(financialGoalValidation.updateFinancialGoal),
  updateFinancialGoal,
);

/**
 * @swagger
 * /goals/{id}/progress:
 *   patch:
 *     summary: Update goal progress by adding or subtracting an amount
 *     tags: [Financial Goals]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Add to or subtract from the current goal amount. Use positive numbers to add progress,
 *       negative numbers to subtract (e.g., if you had to use some saved money).
 *
 *       **Real-time notifications**: If this update causes the goal to be achieved,
 *       automatic notifications will be sent via email, webhooks, and WebSocket.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Financial goal ID
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 example: 250.00
 *                 description: Amount to add (positive) or subtract (negative) from current progress
 *           examples:
 *             add_savings:
 *               summary: Add $250 to savings
 *               value:
 *                 amount: 250.00
 *             monthly_contribution:
 *               summary: Add monthly $500 contribution
 *               value:
 *                 amount: 500.00
 *             emergency_withdrawal:
 *               summary: Subtract $150 for emergency expense
 *               value:
 *                 amount: -150.00
 *             large_deposit:
 *               summary: Add $1000 bonus
 *               value:
 *                 amount: 1000.00
 *     responses:
 *       200:
 *         description: Goal progress updated successfully
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
 *                   example: Goal progress updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     goal:
 *                       $ref: '#/components/schemas/FinancialGoal'
 *                     progress:
 *                       type: object
 *                       properties:
 *                         currentAmount:
 *                           type: number
 *                           example: 2750.00
 *                           description: Updated current amount
 *                         targetAmount:
 *                           type: number
 *                           example: 10000.00
 *                         percentage:
 *                           type: number
 *                           example: 27.5
 *                           description: Updated completion percentage
 *                         remaining:
 *                           type: number
 *                           example: 7250.00
 *                           description: Updated remaining amount
 *                         isAchieved:
 *                           type: boolean
 *                           example: false
 *                           description: Current achievement status
 *                         estimatedCompletion:
 *                           type: string
 *                           nullable: true
 *                           example: '2024-09-20T00:00:00.000Z'
 *                           description: Updated estimated completion
 *                     wasAchieved:
 *                       type: boolean
 *                       example: false
 *                       description: Whether this update caused the goal to be achieved (triggers notifications)
 *             examples:
 *               normal_update:
 *                 summary: Regular progress update
 *                 value:
 *                   status: success
 *                   message: Goal progress updated successfully
 *                   data:
 *                     goal:
 *                       id: 1
 *                       name: Emergency Fund
 *                       targetAmount: 10000.00
 *                       currentAmount: 2750.00
 *                       targetDate: '2024-12-31T23:59:59.999Z'
 *                     progress:
 *                       currentAmount: 2750.00
 *                       targetAmount: 10000.00
 *                       percentage: 27.5
 *                       remaining: 7250.00
 *                       isAchieved: false
 *                       estimatedCompletion: '2024-09-20T00:00:00.000Z'
 *                     wasAchieved: false
 *               goal_achieved:
 *                 summary: Progress update that achieves the goal
 *                 value:
 *                   status: success
 *                   message: Goal progress updated successfully
 *                   data:
 *                     goal:
 *                       id: 1
 *                       name: Emergency Fund
 *                       targetAmount: 10000.00
 *                       currentAmount: 10000.00
 *                       targetDate: '2024-12-31T23:59:59.999Z'
 *                     progress:
 *                       currentAmount: 10000.00
 *                       targetAmount: 10000.00
 *                       percentage: 100.0
 *                       remaining: 0
 *                       isAchieved: true
 *                       estimatedCompletion: null
 *                     wasAchieved: true
 *       400:
 *         description: Invalid amount or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               zero_amount:
 *                 summary: Amount cannot be zero
 *                 value:
 *                   status: error
 *                   message: Amount must be a non-zero number
 *                   statusCode: 400
 *               validation_error:
 *                 summary: Validation failed
 *                 value:
 *                   status: error
 *                   message: Validation failed
 *                   errors:
 *                     amount: Amount must be a non-zero number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch(
  '/:id/progress',
  isVerified,
  validateBody(financialGoalValidation.updateGoalProgress),
  updateGoalProgress,
);

/**
 * @swagger
 * /goals/{id}:
 *   delete:
 *     summary: Delete a financial goal permanently
 *     tags: [Financial Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Financial goal ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Financial goal deleted successfully
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
 *                   example: Financial goal deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', isVerified, deleteFinancialGoal);

export default router;
