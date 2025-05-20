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

router.get('/', getWebhooks);
router.post('/', validateBody(webhookValidation.createWebhook), createWebhook);

router.get('/:id', getWebhookById);
router.put('/:id', validateBody(webhookValidation.updateWebhook), updateWebhook);
router.delete('/:id', deleteWebhook);

router.post('/:id/regenerate-secret', regenerateWebhookSecret);
router.post('/:id/test', testWebhook);

export default router;
