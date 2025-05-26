import { Request, Response, NextFunction } from 'express';
import Webhook, { WebhookEvent } from '../models/webhook.model';
import webhookService from '../services/webhook.service';
import { ApiError } from '../middlewares/error-handler.middleware';

export const createWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const { url, description, events } = req.body;

    try {
      new URL(url);
    } catch (error) {
      console.error('Invalid URL:', error);
      const apiError = new Error('Invalid URL') as ApiError;
      apiError.statusCode = 400;
      throw apiError;
    }

    if (!Array.isArray(events) || events.length === 0) {
      const error = new Error('At least one event must be specified') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const validEvents = Object.values(WebhookEvent);
    for (const event of events) {
      if (!validEvents.includes(event as WebhookEvent)) {
        const error = new Error(`Invalid event: ${event}`) as ApiError;
        error.statusCode = 400;
        throw error;
      }
    }

    const secret = webhookService.generateSecret();

    const webhook = await Webhook.create({
      userId: req.user.userId,
      url,
      secret,
      description,
      events: events as WebhookEvent[],
      isActive: true,
    });

    res.status(201).json({
      status: 'success',
      message: 'Webhook created successfully',
      data: {
        id: webhook.id,
        url: webhook.url,
        secret: webhook.secret, // Only show secret on creation
        description: webhook.description,
        events: webhook.events,
        isActive: webhook.isActive,
        createdAt: webhook.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getWebhooks = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const webhooks = await Webhook.findAll({
      where: {
        userId: req.user.userId,
      },
      attributes: { exclude: ['secret'] },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      count: webhooks.length,
      data: webhooks,
    });
  } catch (error) {
    next(error);
  }
};

export const getWebhookById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const { id } = req.params;

    const webhook = await Webhook.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
      attributes: { exclude: ['secret'] },
    });

    if (!webhook) {
      const error = new Error('Webhook not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      status: 'success',
      data: webhook,
    });
  } catch (error) {
    next(error);
  }
};

export const updateWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const { id } = req.params;
    const { url, description, events, isActive } = req.body;

    const webhook = await Webhook.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!webhook) {
      const error = new Error('Webhook not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    if (url) {
      try {
        new URL(url);
        webhook.url = url;
      } catch (error) {
        console.error('Invalid URL:', error);
        const apiError = new Error('Invalid URL') as ApiError;
        apiError.statusCode = 400;
        throw apiError;
      }
    }

    if (events) {
      if (!Array.isArray(events) || events.length === 0) {
        const error = new Error('At least one event must be specified') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      const validEvents = Object.values(WebhookEvent);
      for (const event of events) {
        if (!validEvents.includes(event as WebhookEvent)) {
          const error = new Error(`Invalid event: ${event}`) as ApiError;
          error.statusCode = 400;
          throw error;
        }
      }

      webhook.events = events as WebhookEvent[];
    }

    if (description !== undefined) {
      webhook.description = description;
    }

    if (isActive !== undefined) {
      webhook.isActive = isActive;

      if (isActive && webhook.failCount > 0) {
        webhook.failCount = 0;
      }
    }

    await webhook.save();

    res.status(200).json({
      status: 'success',
      message: 'Webhook updated successfully',
      data: {
        id: webhook.id,
        url: webhook.url,
        description: webhook.description,
        events: webhook.events,
        isActive: webhook.isActive,
        lastTriggeredAt: webhook.lastTriggeredAt,
        failCount: webhook.failCount,
        updatedAt: webhook.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const { id } = req.params;

    const webhook = await Webhook.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!webhook) {
      const error = new Error('Webhook not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    await webhook.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const regenerateWebhookSecret = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const { id } = req.params;

    const webhook = await Webhook.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!webhook) {
      const error = new Error('Webhook not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    const newSecret = webhookService.generateSecret();
    webhook.secret = newSecret;
    await webhook.save();

    res.status(200).json({
      status: 'success',
      message: 'Webhook secret regenerated successfully',
      data: {
        id: webhook.id,
        secret: newSecret, // Show the new secret to the user
      },
    });
  } catch (error) {
    next(error);
  }
};

export const testWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const { id } = req.params;

    const webhook = await Webhook.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!webhook) {
      const error = new Error('Webhook not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    const success = await webhookService.testWebhook(webhook.url, webhook.secret);

    if (success) {
      res.status(200).json({
        status: 'success',
        message: 'Webhook test was successful',
        data: {
          id: webhook.id,
          url: webhook.url,
        },
      });
    } else {
      const error = new Error('Webhook test failed') as ApiError;
      error.statusCode = 400;
      throw error;
    }
  } catch (error) {
    next(error);
  }
};
