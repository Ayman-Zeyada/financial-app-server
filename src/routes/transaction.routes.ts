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

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get all transactions for authenticated user with pagination and filtering
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/StartDateParam'
 *       - $ref: '#/components/parameters/EndDateParam'
 *       - name: type
 *         in: query
 *         description: Filter transactions by type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE, TRANSFER]
 *           example: EXPENSE
 *       - name: categoryId
 *         in: query
 *         description: Filter transactions by category ID
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: recurring
 *         in: query
 *         description: Filter by recurring status
 *         required: false
 *         schema:
 *           type: boolean
 *           example: false
 *       - name: sortBy
 *         in: query
 *         description: Field to sort by
 *         required: false
 *         schema:
 *           type: string
 *           enum: [date, amount, description, createdAt]
 *           default: date
 *           example: date
 *       - name: sortOrder
 *         in: query
 *         description: Sort order
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *           example: DESC
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *             example:
 *               status: success
 *               pagination:
 *                 totalItems: 45
 *                 totalPages: 5
 *                 currentPage: 1
 *                 limit: 10
 *                 hasNextPage: true
 *                 hasPrevPage: false
 *               data:
 *                 - id: 1
 *                   amount: 25.50
 *                   description: Weekly grocery shopping
 *                   date: '2023-12-07T10:30:00.000Z'
 *                   type: EXPENSE
 *                   recurring: false
 *                   recurringInterval: null
 *                   userId: 1
 *                   categoryId: 1
 *                   Category:
 *                     id: 1
 *                     name: Groceries
 *                     color: '#FF5733'
 *                     icon: shopping-cart
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', getTransactions);

/**
 * @swagger
 * /transactions/recurring:
 *   get:
 *     summary: Get all recurring transactions for authenticated user
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recurring transactions retrieved successfully
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
 *                       - $ref: '#/components/schemas/Transaction'
 *                       - type: object
 *                         properties:
 *                           recurring:
 *                             type: boolean
 *                             example: true
 *                           recurringInterval:
 *                             type: string
 *                             enum: [daily, weekly, biweekly, monthly, quarterly, yearly]
 *                             example: monthly
 *             example:
 *               status: success
 *               count: 2
 *               data:
 *                 - id: 5
 *                   amount: 1200.00
 *                   description: Monthly salary
 *                   type: INCOME
 *                   recurring: true
 *                   recurringInterval: monthly
 *                   Category:
 *                     name: Salary
 *                     type: INCOME
 *                 - id: 8
 *                   amount: 50.00
 *                   description: Monthly gym membership
 *                   type: EXPENSE
 *                   recurring: true
 *                   recurringInterval: monthly
 *                   Category:
 *                     name: Fitness
 *                     type: EXPENSE
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/recurring', getRecurringTransactions);

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - description
 *               - type
 *               - categoryId
 *             properties:
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0.01
 *                 example: 25.50
 *                 description: Transaction amount (must be positive)
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 example: Weekly grocery shopping
 *                 description: Transaction description
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: '2023-12-07T10:30:00.000Z'
 *                 description: Transaction date (defaults to current date if not provided)
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE, TRANSFER]
 *                 example: EXPENSE
 *                 description: Transaction type (must match category type)
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *                 description: ID of the category (must belong to user and match transaction type)
 *               recurring:
 *                 type: boolean
 *                 default: false
 *                 example: false
 *                 description: Whether this is a recurring transaction
 *               recurringInterval:
 *                 type: string
 *                 enum: [daily, weekly, biweekly, monthly, quarterly, yearly]
 *                 nullable: true
 *                 example: null
 *                 description: Recurring interval (required if recurring is true)
 *           examples:
 *             simple_expense:
 *               summary: Simple expense transaction
 *               value:
 *                 amount: 25.50
 *                 description: Weekly grocery shopping
 *                 type: EXPENSE
 *                 categoryId: 1
 *             recurring_income:
 *               summary: Recurring income transaction
 *               value:
 *                 amount: 3000.00
 *                 description: Monthly salary
 *                 type: INCOME
 *                 categoryId: 2
 *                 recurring: true
 *                 recurringInterval: monthly
 *             scheduled_expense:
 *               summary: Future scheduled expense
 *               value:
 *                 amount: 120.00
 *                 description: Annual insurance payment
 *                 date: '2024-01-15T09:00:00.000Z'
 *                 type: EXPENSE
 *                 categoryId: 3
 *     responses:
 *       201:
 *         description: Transaction created successfully
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
 *                   example: Transaction created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Validation error or business rule violation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               type_mismatch:
 *                 summary: Transaction type doesn't match category type
 *                 value:
 *                   status: error
 *                   message: Transaction type must match category type (EXPENSE)
 *                   statusCode: 400
 *               validation_error:
 *                 summary: Validation failed
 *                 value:
 *                   status: error
 *                   message: Validation failed
 *                   errors:
 *                     amount: Amount must be a positive number
 *                     description: Description is required
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
router.post(
  '/',
  isVerified,
  validateBody(transactionValidation.createTransaction),
  createTransaction,
);

/**
 * @swagger
 * /transactions/bulk:
 *   post:
 *     summary: Create multiple transactions at once
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactions
 *             properties:
 *               transactions:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - amount
 *                     - description
 *                     - type
 *                     - categoryId
 *                   properties:
 *                     amount:
 *                       type: number
 *                       format: decimal
 *                       minimum: 0.01
 *                     description:
 *                       type: string
 *                       minLength: 1
 *                       maxLength: 200
 *                     date:
 *                       type: string
 *                       format: date-time
 *                     type:
 *                       type: string
 *                       enum: [INCOME, EXPENSE, TRANSFER]
 *                     categoryId:
 *                       type: integer
 *                     recurring:
 *                       type: boolean
 *                       default: false
 *                     recurringInterval:
 *                       type: string
 *                       enum: [daily, weekly, biweekly, monthly, quarterly, yearly]
 *                       nullable: true
 *                 example:
 *                   - amount: 25.50
 *                     description: Grocery shopping
 *                     type: EXPENSE
 *                     categoryId: 1
 *                   - amount: 12.99
 *                     description: Netflix subscription
 *                     type: EXPENSE
 *                     categoryId: 4
 *                     recurring: true
 *                     recurringInterval: monthly
 *                   - amount: 500.00
 *                     description: Freelance work payment
 *                     type: INCOME
 *                     categoryId: 2
 *     responses:
 *       201:
 *         description: Transactions created successfully
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
 *                   example: Successfully created 3 transactions
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: One or more categories not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example:
 *               status: error
 *               message: One or more categories not found or do not belong to user
 *               statusCode: 404
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/bulk',
  isVerified,
  validateBody(transactionValidation.bulkCreateTransactions),
  bulkCreateTransactions,
);

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Get a specific transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Transaction ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', getTransactionById);

/**
 * @swagger
 * /transactions/{id}:
 *   put:
 *     summary: Update a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Transaction ID
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
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0.01
 *                 example: 30.75
 *                 description: Updated transaction amount
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 example: Updated grocery shopping with additional items
 *                 description: Updated transaction description
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: '2023-12-08T14:30:00.000Z'
 *                 description: Updated transaction date
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE, TRANSFER]
 *                 example: EXPENSE
 *                 description: Updated transaction type (must match new category if provided)
 *               categoryId:
 *                 type: integer
 *                 example: 2
 *                 description: Updated category ID (must belong to user and match type)
 *               recurring:
 *                 type: boolean
 *                 example: true
 *                 description: Updated recurring status
 *               recurringInterval:
 *                 type: string
 *                 enum: [daily, weekly, biweekly, monthly, quarterly, yearly]
 *                 nullable: true
 *                 example: weekly
 *                 description: Updated recurring interval
 *           examples:
 *             update_amount:
 *               summary: Update only amount
 *               value:
 *                 amount: 30.75
 *             update_category:
 *               summary: Update category and type
 *               value:
 *                 categoryId: 3
 *                 type: EXPENSE
 *             make_recurring:
 *               summary: Make transaction recurring
 *               value:
 *                 recurring: true
 *                 recurringInterval: monthly
 *     responses:
 *       200:
 *         description: Transaction updated successfully
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
 *                   example: Transaction updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Validation error or business rule violation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               type_mismatch:
 *                 summary: Type doesn't match category
 *                 value:
 *                   status: error
 *                   message: New category type (INCOME) does not match transaction type (EXPENSE)
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
 *         description: Transaction or category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               transaction_not_found:
 *                 summary: Transaction not found
 *                 value:
 *                   status: error
 *                   message: Transaction not found
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
router.put(
  '/:id',
  isVerified,
  validateBody(transactionValidation.updateTransaction),
  updateTransaction,
);

/**
 * @swagger
 * /transactions/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Transaction ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
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
 *                   example: Transaction deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', isVerified, deleteTransaction);

export default router;
