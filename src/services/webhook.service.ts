import axios from 'axios';
import crypto from 'crypto';
import Webhook, { WebhookEvent } from '../models/webhook.model';
import { sequelize } from '../config/database';
import logger from '../utils/logger';
import { Op, WhereOptions } from 'sequelize';

class WebhookService {
  private createSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  async triggerWebhook(event: WebhookEvent, userId: number, payload: any): Promise<void> {
    const isPostgres = sequelize.getDialect() === 'postgres';

    let webhooks: Webhook[] = [];

    if (isPostgres) {
      webhooks = await Webhook.findAll({
        where: {
          userId,
          isActive: true,
          events: {
            [Op.contains]: [event],
          },
        },
      });

      const allEventsWebhooks = await Webhook.findAll({
        where: {
          userId,
          isActive: true,
          events: {
            [Op.contains]: [WebhookEvent.ALL],
          },
        },
      });

      const webhookIds = new Set(webhooks.map((w) => w.id));
      for (const webhook of allEventsWebhooks) {
        if (!webhookIds.has(webhook.id)) {
          webhooks.push(webhook);
        }
      }
    } else {
      const allWebhooks = await Webhook.findAll({
        where: {
          userId,
          isActive: true,
        },
      });

      webhooks = allWebhooks.filter((webhook) => {
        return webhook.events.includes(event) || webhook.events.includes(WebhookEvent.ALL);
      });
    }

    if (webhooks.length === 0) {
      return;
    }

    logger.info(`Triggering ${webhooks.length} webhooks for event ${event} for user ${userId}`);

    const webhookPayload = {
      event,
      created_at: new Date().toISOString(),
      data: payload,
    };

    const sendPromises = webhooks.map(async (webhook) => {
      const signature = this.createSignature(webhookPayload, webhook.secret);

      try {
        const response = await axios.post(webhook.url, webhookPayload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event,
          },
          timeout: 10000, // 10 seconds timeout
        });

        await webhook.update({
          lastTriggeredAt: new Date(),
          failCount: 0,
        });

        logger.info(`Webhook ${webhook.id} successfully delivered to ${webhook.url}`);
        return { webhookId: webhook.id, success: true };
      } catch (error) {
        const failCount = webhook.failCount + 1;

        const isActive = failCount < 10;

        await webhook.update({
          failCount,
          isActive,
        });

        if (!isActive) {
          logger.warn(`Webhook ${webhook.id} disabled after ${failCount} consecutive failures`);
        }

        logger.error(
          `Webhook ${webhook.id} delivery failed: ${error instanceof Error ? error.message : error}`,
        );
        return { webhookId: webhook.id, success: false, error };
      }
    });

    await Promise.all(sendPromises);
  }

  generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async reactivateWebhook(webhookId: number, userId: number): Promise<Webhook | null> {
    const webhook = await Webhook.findOne({
      where: {
        id: webhookId,
        userId,
      },
    });

    if (!webhook) {
      return null;
    }

    webhook.isActive = true;
    webhook.failCount = 0;
    await webhook.save();

    return webhook;
  }

  async testWebhook(url: string, secret: string): Promise<boolean> {
    const testPayload = {
      event: 'webhook.test',
      created_at: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from your financial app',
      },
    };

    const signature = this.createSignature(testPayload, secret);

    try {
      await axios.post(url, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': 'webhook.test',
        },
        timeout: 5000, // 5 seconds timeout for test
      });

      return true;
    } catch (error) {
      logger.error(
        `Webhook test failed for ${url}: ${error instanceof Error ? error.message : error}`,
      );
      return false;
    }
  }
}

export const webhookService = new WebhookService();
export default webhookService;
