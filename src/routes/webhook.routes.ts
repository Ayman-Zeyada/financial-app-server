import express, { Router } from 'express';
import {
  createWebhook,
  getWebhooks,
  getWebhookById,
  updateWebhook,
  deleteWebhook,
  regenerateWebhookSecret,
  testWebhook,
} from '../controllers/webhook.controller';
import { authenticate, isVerified } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { webhookValidation } from './validation/webhook.validation';

const router: Router = express.Router();

router.use(authenticate);
router.use(isVerified);

/**
 * @swagger
 * /webhooks:
 *   get:
 *     summary: Get all webhooks for authenticated user
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Webhooks retrieved successfully
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
 *                     $ref: '#/components/schemas/Webhook'
 *             example:
 *               status: success
 *               count: 2
 *               data:
 *                 - id: 1
 *                   url: 'https://example.com/webhook'
 *                   description: Transaction notifications
 *                   events: ['transaction.created', 'budget.alert']
 *                   isActive: true
 *                   lastTriggeredAt: '2023-12-07T10:30:00.000Z'
 *                   failCount: 0
 *                   userId: 1
 *                   createdAt: '2023-12-01T10:30:00.000Z'
 *                   updatedAt: '2023-12-07T10:30:00.000Z'
 *                 - id: 2
 *                   url: 'https://api.myapp.com/notifications'
 *                   description: Goal achievement alerts
 *                   events: ['goal.achieved']
 *                   isActive: false
 *                   lastTriggeredAt: null
 *                   failCount: 3
 *                   userId: 1
 *                   createdAt: '2023-11-15T14:20:00.000Z'
 *                   updatedAt: '2023-12-05T16:45:00.000Z'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', getWebhooks);

/**
 * @swagger
 * /webhooks:
 *   post:
 *     summary: Create a new webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Create a new webhook to receive real-time notifications for financial events.
 *
 *       **Available Events:**
 *       - `transaction.created` - New transaction added
 *       - `transaction.updated` - Transaction modified
 *       - `transaction.deleted` - Transaction removed
 *       - `budget.alert` - Budget limit exceeded or warning threshold reached
 *       - `goal.achieved` - Financial goal target reached
 *       - `*` - All events (wildcard)
 *
 *       **Webhook Payload:** All webhooks receive a standardized payload with event type, timestamp, user ID, and event-specific data.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - events
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: 'https://example.com/webhook'
 *                 description: HTTPS URL to receive webhook notifications
 *               description:
 *                 type: string
 *                 maxLength: 200
 *                 example: Transaction notifications for external system
 *                 description: Optional description of webhook purpose
 *               events:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: string
 *                   enum: ['transaction.created', 'transaction.updated', 'transaction.deleted', 'budget.alert', 'goal.achieved', '*']
 *                 example: ['transaction.created', 'budget.alert']
 *                 description: List of events to subscribe to
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *                 description: Whether webhook should receive notifications
 *           examples:
 *             transaction_webhook:
 *               summary: Transaction event webhook
 *               value:
 *                 url: 'https://myapp.com/api/transactions/webhook'
 *                 description: Sync transactions with external accounting system
 *                 events: ['transaction.created', 'transaction.updated', 'transaction.deleted']
 *                 isActive: true
 *             budget_alerts:
 *               summary: Budget alert webhook
 *               value:
 *                 url: 'https://notifications.example.com/budget-alerts'
 *                 description: Budget overspending notifications
 *                 events: ['budget.alert']
 *             goal_achievements:
 *               summary: Goal achievement webhook
 *               value:
 *                 url: 'https://rewards.myapp.com/goal-achieved'
 *                 description: Trigger rewards when goals are achieved
 *                 events: ['goal.achieved']
 *             all_events:
 *               summary: Catch-all webhook
 *               value:
 *                 url: 'https://analytics.example.com/financial-events'
 *                 description: Analytics system for all financial events
 *                 events: ['*']
 *     responses:
 *       201:
 *         description: Webhook created successfully
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
 *                   example: Webhook created successfully
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Webhook'
 *                     - type: object
 *                       properties:
 *                         secret:
 *                           type: string
 *                           example: whsec_1234567890abcdef
 *                           description: Webhook secret for signature verification (only returned on creation)
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
 *                     url: URL must be a valid HTTPS URL
 *                     events: At least one event must be selected
 *               invalid_url:
 *                 summary: Invalid webhook URL
 *                 value:
 *                   status: error
 *                   message: Validation failed
 *                   errors:
 *                     url: Webhook URL must use HTTPS protocol
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', validateBody(webhookValidation.createWebhook), createWebhook);

/**
 * @swagger
 * /webhooks/{id}:
 *   get:
 *     summary: Get a specific webhook by ID
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Webhook ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Webhook retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Webhook'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', getWebhookById);

/**
 * @swagger
 * /webhooks/{id}:
 *   put:
 *     summary: Update a webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Webhook ID
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
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: 'https://updated.example.com/webhook'
 *                 description: Updated HTTPS URL to receive notifications
 *               description:
 *                 type: string
 *                 maxLength: 200
 *                 example: Updated webhook description
 *                 description: Updated description
 *               events:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: string
 *                   enum: ['transaction.created', 'transaction.updated', 'transaction.deleted', 'budget.alert', 'goal.achieved', '*']
 *                 example: ['transaction.created', 'goal.achieved']
 *                 description: Updated list of events to subscribe to
 *               isActive:
 *                 type: boolean
 *                 example: false
 *                 description: Enable or disable webhook notifications
 *           examples:
 *             update_url:
 *               summary: Update webhook URL
 *               value:
 *                 url: 'https://new-endpoint.example.com/webhook'
 *             add_events:
 *               summary: Add more event types
 *               value:
 *                 events: ['transaction.created', 'transaction.updated', 'budget.alert', 'goal.achieved']
 *             disable_webhook:
 *               summary: Temporarily disable webhook
 *               value:
 *                 isActive: false
 *             update_all:
 *               summary: Update all webhook properties
 *               value:
 *                 url: 'https://api.newservice.com/webhooks/financial'
 *                 description: Migration to new notification service
 *                 events: ['*']
 *                 isActive: true
 *     responses:
 *       200:
 *         description: Webhook updated successfully
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
 *                   example: Webhook updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Webhook'
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
router.put('/:id', validateBody(webhookValidation.updateWebhook), updateWebhook);

/**
 * @swagger
 * /webhooks/{id}:
 *   delete:
 *     summary: Delete a webhook permanently
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Webhook ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Webhook deleted successfully
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
 *                   example: Webhook deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', deleteWebhook);

/**
 * @swagger
 * /webhooks/{id}/regenerate-secret:
 *   post:
 *     summary: Regenerate webhook secret for signature verification
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Generate a new secret for webhook signature verification. This invalidates the previous secret.
 *
 *       **Use cases:**
 *       - Secret has been compromised
 *       - Rotating secrets for security compliance
 *       - Initial secret was lost
 *
 *       **Important:** Update your webhook handler with the new secret immediately to avoid failed verifications.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Webhook ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Webhook secret regenerated successfully
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
 *                   example: Webhook secret regenerated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     secret:
 *                       type: string
 *                       example: whsec_9876543210fedcba
 *                       description: New webhook secret for signature verification
 *             example:
 *               status: success
 *               message: Webhook secret regenerated successfully
 *               data:
 *                 secret: whsec_9876543210fedcba
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/:id/regenerate-secret', regenerateWebhookSecret);

/**
 * @swagger
 * /webhooks/{id}/test:
 *   post:
 *     summary: Send a test notification to webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Send a test payload to the webhook URL to verify connectivity and handler functionality.
 *
 *       **Test Payload Structure:**
 *       ```json
 *       {
 *         "event": "webhook.test",
 *         "timestamp": "2023-12-07T10:30:00.000Z",
 *         "userId": 1,
 *         "data": {
 *           "message": "This is a test webhook notification",
 *           "webhookId": 1
 *         }
 *       }
 *       ```
 *
 *       **Response Validation:**
 *       - Successful test: Webhook endpoint returns 2xx status code
 *       - Failed test: Non-2xx status code or network/timeout errors
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Webhook ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Webhook test completed
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
 *                   example: Webhook test successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                       description: Whether the test was successful
 *                     responseStatus:
 *                       type: integer
 *                       example: 200
 *                       description: HTTP status code returned by webhook endpoint
 *                     responseTime:
 *                       type: number
 *                       example: 125
 *                       description: Response time in milliseconds
 *                     error:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                       description: Error message if test failed
 *             examples:
 *               successful_test:
 *                 summary: Successful webhook test
 *                 value:
 *                   status: success
 *                   message: Webhook test successful
 *                   data:
 *                     success: true
 *                     responseStatus: 200
 *                     responseTime: 125
 *                     error: null
 *               failed_test:
 *                 summary: Failed webhook test
 *                 value:
 *                   status: success
 *                   message: Webhook test completed
 *                   data:
 *                     success: false
 *                     responseStatus: 500
 *                     responseTime: 3000
 *                     error: Internal Server Error
 *               timeout_test:
 *                 summary: Webhook test timeout
 *                 value:
 *                   status: success
 *                   message: Webhook test completed
 *                   data:
 *                     success: false
 *                     responseStatus: null
 *                     responseTime: 5000
 *                     error: Request timeout
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/:id/test', testWebhook);

export default router;
