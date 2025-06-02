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

/**
 * @swagger
 * /data/import/transactions:
 *   post:
 *     summary: Import transactions from CSV or JSON file
 *     tags: [Data Processing]
 *     security:
 *       - bearerAuth: []
 *     description: Import transaction data from uploaded CSV or JSON files
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV or JSON file containing transaction data (max 10MB)
 *     responses:
 *       200:
 *         description: Import completed with results summary
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
 *                   example: Successfully imported 15 transactions
 *                 data:
 *                   type: object
 *                   properties:
 *                     imported:
 *                       type: integer
 *                       example: 15
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       413:
 *         description: File too large
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/import/transactions', isVerified, upload.single('file'), importTransactions);

/**
 * @swagger
 * /data/import/categories:
 *   post:
 *     summary: Import categories from CSV or JSON file
 *     tags: [Data Processing]
 *     security:
 *       - bearerAuth: []
 *     description: Import category data from uploaded CSV or JSON files
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV or JSON file containing category data (max 10MB)
 *     responses:
 *       200:
 *         description: Import completed with results summary
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
 *                   example: Successfully imported 8 categories
 *                 data:
 *                   type: object
 *                   properties:
 *                     imported:
 *                       type: integer
 *                       example: 8
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/import/categories', isVerified, upload.single('file'), importCategories);

/**
 * @swagger
 * /data/import/budgets:
 *   post:
 *     summary: Import budgets from CSV or JSON file
 *     tags: [Data Processing]
 *     security:
 *       - bearerAuth: []
 *     description: Import budget data from uploaded CSV or JSON files
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV or JSON file containing budget data (max 10MB)
 *     responses:
 *       200:
 *         description: Import completed with results summary
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
 *                   example: Successfully imported 5 budgets
 *                 data:
 *                   type: object
 *                   properties:
 *                     imported:
 *                       type: integer
 *                       example: 5
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/import/budgets', isVerified, upload.single('file'), importBudgets);

/**
 * @swagger
 * /data/import/goals:
 *   post:
 *     summary: Import financial goals from CSV or JSON file
 *     tags: [Data Processing]
 *     security:
 *       - bearerAuth: []
 *     description: Import financial goal data from uploaded CSV or JSON files
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV or JSON file containing financial goal data (max 10MB)
 *     responses:
 *       200:
 *         description: Import completed with results summary
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
 *                   example: Successfully imported 3 financial goals
 *                 data:
 *                   type: object
 *                   properties:
 *                     imported:
 *                       type: integer
 *                       example: 3
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/import/goals', isVerified, upload.single('file'), importFinancialGoals);

/**
 * @swagger
 * /data/validate:
 *   post:
 *     summary: Validate import file format and structure without importing
 *     tags: [Data Processing]
 *     security:
 *       - bearerAuth: []
 *     description: Validate the structure and format of an import file without actually importing the data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV or JSON file to validate (max 10MB)
 *               dataType:
 *                 type: string
 *                 enum: [transactions, categories, budgets, goals]
 *                 default: transactions
 *                 example: transactions
 *                 description: Type of data being validated
 *     responses:
 *       200:
 *         description: File validation completed
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
 *                     valid:
 *                       type: boolean
 *                       example: true
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/validate', upload.single('file'), validateImportFile);

/**
 * @swagger
 * /data/export/transactions:
 *   get:
 *     summary: Export transactions to CSV format
 *     tags: [Data Processing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - name: format
 *         in: query
 *         description: Export format
 *         required: false
 *         schema:
 *           type: string
 *           enum: [csv]
 *           default: csv
 *           example: csv
 *       - name: download
 *         in: query
 *         description: Return file content directly for download
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *           example: true
 *     responses:
 *       200:
 *         description: Export completed successfully
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
 *                   example: Export completed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     filePath:
 *                       type: string
 *                       example: transactions_1_2023-12-07T10-30-00.csv
 *                     downloadUrl:
 *                       type: string
 *                       example: /api/data/download/transactions_1_2023-12-07T10-30-00.csv
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/export/transactions', exportTransactions);

/**
 * @swagger
 * /data/export/categories:
 *   get:
 *     summary: Export categories to CSV format
 *     tags: [Data Processing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: format
 *         in: query
 *         description: Export format
 *         required: false
 *         schema:
 *           type: string
 *           enum: [csv]
 *           default: csv
 *           example: csv
 *       - name: download
 *         in: query
 *         description: Return file content directly for download
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *           example: true
 *     responses:
 *       200:
 *         description: Export completed successfully
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
 *                   example: Export completed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     filePath:
 *                       type: string
 *                       example: categories_1_2023-12-07T10-30-00.csv
 *                     downloadUrl:
 *                       type: string
 *                       example: /api/data/download/categories_1_2023-12-07T10-30-00.csv
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/export/categories', exportCategories);

/**
 * @swagger
 * /data/export/budgets:
 *   get:
 *     summary: Export budgets to CSV format
 *     tags: [Data Processing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: format
 *         in: query
 *         description: Export format
 *         required: false
 *         schema:
 *           type: string
 *           enum: [csv]
 *           default: csv
 *           example: csv
 *       - name: download
 *         in: query
 *         description: Return file content directly for download
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *           example: true
 *     responses:
 *       200:
 *         description: Export completed successfully
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
 *                   example: Export completed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     filePath:
 *                       type: string
 *                       example: budgets_1_2023-12-07T10-30-00.csv
 *                     downloadUrl:
 *                       type: string
 *                       example: /api/data/download/budgets_1_2023-12-07T10-30-00.csv
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/export/budgets', exportBudgets);

/**
 * @swagger
 * /data/export/goals:
 *   get:
 *     summary: Export financial goals to CSV format
 *     tags: [Data Processing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: format
 *         in: query
 *         description: Export format
 *         required: false
 *         schema:
 *           type: string
 *           enum: [csv]
 *           default: csv
 *           example: csv
 *       - name: download
 *         in: query
 *         description: Return file content directly for download
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *           example: true
 *     responses:
 *       200:
 *         description: Export completed successfully
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
 *                   example: Export completed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     filePath:
 *                       type: string
 *                       example: goals_1_2023-12-07T10-30-00.csv
 *                     downloadUrl:
 *                       type: string
 *                       example: /api/data/download/goals_1_2023-12-07T10-30-00.csv
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/export/goals', exportFinancialGoals);

/**
 * @swagger
 * /data/download/{filename}:
 *   get:
 *     summary: Download exported data file
 *     tags: [Data Processing]
 *     security:
 *       - bearerAuth: []
 *     description: Download a previously exported data file
 *     parameters:
 *       - name: filename
 *         in: path
 *         required: true
 *         description: Filename returned from export endpoint
 *         schema:
 *           type: string
 *           example: transactions_1_2023-12-07T10-30-00.csv
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Unauthorized access to file
 *       404:
 *         description: File not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/download/:filename', downloadFile);

export default router;
