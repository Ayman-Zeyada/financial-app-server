import express, { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import transactionRoutes from './transaction.routes';
import categoryRoutes from './category.routes';
import budgetRoutes from './budget.routes';
import reportRoutes from './report.routes';
import financialGoalRoutes from './financial-goal.routes';
import dataProcessingRoutes from './data-processing.routes';
import webhookRoutes from './webhook.routes';

const router: Router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: API health check
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API is running successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2023-12-07T10:30:00.000Z
 *                 uptime:
 *                   type: number
 *                   example: 12345.67
 *                   description: Server uptime in seconds
 *                 environment:
 *                   type: string
 *                   example: development
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  });
});

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check with database connectivity
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Detailed health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 12345.67
 *                 environment:
 *                   type: string
 *                   example: development
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: connected
 *                         responseTime:
 *                           type: number
 *                           example: 15.23
 *                     redis:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: not_configured
 *                 memory:
 *                   type: object
 *                   properties:
 *                     used:
 *                       type: number
 *                       example: 45.67
 *                     total:
 *                       type: number
 *                       example: 134.22
 *                     percentage:
 *                       type: number
 *                       example: 34.02
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/health/detailed', async (req, res) => {
  try {
    const startTime = Date.now();

    // Test database connection
    const { sequelize } = require('../models');
    await sequelize.authenticate();
    const dbResponseTime = Date.now() - startTime;

    // Get memory usage
    const memUsage = process.memoryUsage();
    const memoryInfo = {
      used: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100, // MB
      total: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100, // MB
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100 * 100) / 100,
    };

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: {
          status: 'connected',
          responseTime: dbResponseTime,
        },
        redis: {
          status: 'not_configured',
        },
      },
      memory: memoryInfo,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
    });
  }
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/transactions', transactionRoutes);
router.use('/categories', categoryRoutes);
router.use('/budgets', budgetRoutes);
router.use('/goals', financialGoalRoutes);
router.use('/reports', reportRoutes);
router.use('/data', dataProcessingRoutes);
router.use('/webhooks', webhookRoutes);

export default router;
