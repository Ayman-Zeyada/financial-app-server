import { ValidationSchema } from '../../middlewares/validation.middleware';
import { WebhookEvent } from '../../models/webhook.model';

export const webhookValidation: Record<string, ValidationSchema> = {
  createWebhook: {
    url: {
      required: true,
      type: 'string',
      custom: (value: any) => {
        try {
          new URL(value);
          return true;
        } catch (error) {
          return false;
        }
      },
      message: 'Please provide a valid URL',
    },
    description: {
      type: 'string',
      maxLength: 200,
      message: 'Description must be at most 200 characters',
    },
    events: {
      required: true,
      type: 'array',
      custom: (value: any) => {
        if (!Array.isArray(value) || value.length === 0) {
          return false;
        }
        const validEvents = Object.values(WebhookEvent);
        return value.every((event) => validEvents.includes(event));
      },
      message: 'Please provide a valid array of events',
    },
  },
  updateWebhook: {
    url: {
      type: 'string',
      custom: (value: any) => {
        try {
          new URL(value);
          return true;
        } catch (error) {
          return false;
        }
      },
      message: 'Please provide a valid URL',
    },
    description: {
      type: 'string',
      maxLength: 200,
      message: 'Description must be at most 200 characters',
    },
    events: {
      type: 'array',
      custom: (value: any) => {
        if (!Array.isArray(value) || value.length === 0) {
          return false;
        }
        const validEvents = Object.values(WebhookEvent);
        return value.every((event) => validEvents.includes(event));
      },
      message: 'Please provide a valid array of events',
    },
    isActive: {
      type: 'boolean',
      message: 'isActive must be a boolean',
    },
  },
};
