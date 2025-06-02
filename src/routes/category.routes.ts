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

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories for authenticated user
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: type
 *         in: query
 *         description: Filter categories by type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *           example: EXPENSE
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
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
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', getCategories);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
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
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 example: Groceries
 *                 description: Category name (1-50 characters)
 *               description:
 *                 type: string
 *                 maxLength: 200
 *                 example: Food and household items
 *                 description: Optional category description
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *                 example: EXPENSE
 *                 description: Category type
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-F]{6}$'
 *                 example: '#FF5733'
 *                 description: Hex color code for the category
 *               icon:
 *                 type: string
 *                 maxLength: 50
 *                 example: shopping-cart
 *                 description: Icon identifier for the category
 *     responses:
 *       201:
 *         description: Category created successfully
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
 *                   example: Category created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: Category with this name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example:
 *               status: error
 *               message: Category with name 'Groceries' already exists
 *               statusCode: 409
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', isVerified, validateBody(categoryValidation.createCategory), createCategory);

/**
 * @swagger
 * /categories/bulk:
 *   post:
 *     summary: Create multiple categories at once
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categories
 *             properties:
 *               categories:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - type
 *                   properties:
 *                     name:
 *                       type: string
 *                       minLength: 1
 *                       maxLength: 50
 *                       example: Groceries
 *                     description:
 *                       type: string
 *                       maxLength: 200
 *                       example: Food and household items
 *                     type:
 *                       type: string
 *                       enum: [INCOME, EXPENSE]
 *                       example: EXPENSE
 *                     color:
 *                       type: string
 *                       pattern: '^#[0-9A-F]{6}$'
 *                       example: '#FF5733'
 *                     icon:
 *                       type: string
 *                       maxLength: 50
 *                       example: shopping-cart
 *                 example:
 *                   - name: Groceries
 *                     type: EXPENSE
 *                     color: '#FF5733'
 *                     icon: shopping-cart
 *                   - name: Salary
 *                     type: INCOME
 *                     color: '#28a745'
 *                     icon: dollar-sign
 *     responses:
 *       201:
 *         description: Categories created successfully
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
 *                   example: Successfully created 2 categories
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: One or more categories already exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/bulk',
  isVerified,
  validateBody(categoryValidation.bulkCreateCategories),
  bulkCreateCategories,
);

/**
 * @swagger
 * /categories/{id}/transactions:
 *   get:
 *     summary: Get all transactions for a specific category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Category ID
 *         schema:
 *           type: integer
 *           example: 1
 *       - $ref: '#/components/parameters/StartDateParam'
 *       - $ref: '#/components/parameters/EndDateParam'
 *       - name: limit
 *         in: query
 *         description: Number of transactions to return
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - name: offset
 *         in: query
 *         description: Number of transactions to skip
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: Category transactions retrieved successfully
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
 *                   example: 15
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id/transactions', getCategoryTransactions);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get a specific category by ID
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Category ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', getCategoryById);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Category ID
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
 *                 maxLength: 50
 *                 example: Updated Groceries
 *                 description: New category name
 *               description:
 *                 type: string
 *                 maxLength: 200
 *                 example: Updated description for food expenses
 *                 description: New category description
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *                 example: EXPENSE
 *                 description: Category type (note - changing type may fail if incompatible transactions exist)
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-F]{6}$'
 *                 example: '#33FF57'
 *                 description: New hex color code
 *               icon:
 *                 type: string
 *                 maxLength: 50
 *                 example: basket
 *                 description: New icon identifier
 *     responses:
 *       200:
 *         description: Category updated successfully
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
 *                   example: Category updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error or type change conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               validation_error:
 *                 summary: Validation error
 *                 value:
 *                   status: error
 *                   message: Validation failed
 *                   errors:
 *                     name: Name must be 1-50 characters
 *               type_conflict:
 *                 summary: Type change conflict
 *                 value:
 *                   status: error
 *                   message: Cannot change category type because there are 5 transactions with type EXPENSE
 *                   statusCode: 400
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Category name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id', isVerified, validateBody(categoryValidation.updateCategory), updateCategory);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Category ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Category deleted successfully
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
 *                   example: Category deleted successfully
 *       400:
 *         description: Cannot delete category with associated transactions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example:
 *               status: error
 *               message: Cannot delete category because it is assigned to 12 transactions. Reassign or delete these transactions first.
 *               statusCode: 400
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', isVerified, deleteCategory);

export default router;
