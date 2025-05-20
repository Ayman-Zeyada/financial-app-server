import { Request, Response, NextFunction } from 'express';
import { ApiError } from './error-handler.middleware';
import logger from '../utils/logger';

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  statusCode?: number;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

setInterval(
  () => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime <= now) {
        delete store[key];
      }
    });
  },
  5 * 60 * 1000,
);

export const rateLimiter = (options: RateLimitOptions = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // Default: 1 minute
  const max = options.max || 100; // Default: 100 requests per window
  const message = options.message || 'Too many requests, please try again later.';
  const statusCode = options.statusCode || 429; // 429 Too Many Requests

  const defaultKeyGenerator = (req: Request): string => {
    return req.user?.userId
      ? `user:${req.user.userId}`
      : `ip:${req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress}`;
  };

  const keyGenerator = options.keyGenerator || defaultKeyGenerator;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    if (!store[key] || store[key].resetTime <= now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };

      res.setHeader('X-RateLimit-Limit', max.toString());
      res.setHeader('X-RateLimit-Remaining', (max - 1).toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(store[key].resetTime / 1000).toString());

      next();
      return;
    }

    store[key].count += 1;

    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - store[key].count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(store[key].resetTime / 1000).toString());

    if (store[key].count > max) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());

      logger.warn(`Rate limit exceeded for ${key}`);

      const error = new Error(message) as ApiError;
      error.statusCode = statusCode;
      next(error);
      return;
    }

    next();
  };
};
