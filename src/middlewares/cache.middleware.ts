import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const memoryCache: { [key: string]: { data: any; expiry: number; statusCode: number } } = {};

const CLEANUP_INTERVAL = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  Object.keys(memoryCache).forEach((key) => {
    if (memoryCache[key].expiry <= now) {
      delete memoryCache[key];
    }
  });
}, CLEANUP_INTERVAL);

export interface SimpleCacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string | ((req: Request) => string); // Custom key or function to generate key
}

declare global {
  namespace Express {
    interface Response {
      clearCache(key?: string): void;
    }
  }
}

const SKIP_CACHE_ROUTES = [
  '/api/auth/',
  '/api/users/',
  '/api/transactions/',
  '/api/budgets/',
  '/api/categories/',
  '/api/financial-goals/',
  '/api/reports/',
  '/api/webhooks/',
  '/api/data-processing/',
];

const shouldSkipCache = (req: Request): boolean => {
  if (req.method !== 'GET') {
    return true;
  }

  return SKIP_CACHE_ROUTES.some((route) => req.path.startsWith(route));
};

export const simpleCacheMiddleware = (options: SimpleCacheOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (shouldSkipCache(req)) {
      return next();
    }

    let cacheKey: string;
    if (options.key) {
      if (typeof options.key === 'function') {
        cacheKey = options.key(req);
      } else {
        cacheKey = options.key;
      }
    } else {
      const userId = req.user?.userId || 'anonymous';
      cacheKey = `${userId}:${req.originalUrl}`;
    }

    logger.debug(`Cache key: ${cacheKey}`);

    const cachedItem = memoryCache[cacheKey];
    if (cachedItem && cachedItem.expiry > Date.now()) {
      logger.debug(`Cache hit: ${cacheKey}`);
      res.status(cachedItem.statusCode).json(cachedItem.data);
      return;
    }

    logger.debug(`Cache miss: ${cacheKey}`);

    const originalJson = res.json;

    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const ttl = options.ttl || 300; // Default TTL is 5 minutes

        memoryCache[cacheKey] = {
          data: body,
          statusCode: res.statusCode,
          expiry: Date.now() + ttl * 1000,
        };

        logger.debug(`Cached: ${cacheKey} with TTL ${ttl}s`);
      }

      return originalJson.call(this, body);
    };

    res.clearCache = (key?: string) => {
      if (key) {
        if (key.includes('*')) {
          const pattern = new RegExp(key.replace(/\*/g, '.*'));
          Object.keys(memoryCache).forEach((k) => {
            if (pattern.test(k)) {
              delete memoryCache[k];
              logger.debug(`Cleared cache for key: ${k}`);
            }
          });
        } else {
          delete memoryCache[key];
          logger.debug(`Cleared cache for key: ${key}`);
        }
      } else {
        Object.keys(memoryCache).forEach((k) => {
          delete memoryCache[k];
        });
        logger.debug('Cleared all cache');
      }
    };

    next();
  };
};

export const clearCache = (key?: string) => {
  if (key) {
    if (key.includes('*')) {
      const pattern = new RegExp(key.replace(/\*/g, '.*'));
      let count = 0;
      Object.keys(memoryCache).forEach((k) => {
        if (pattern.test(k)) {
          delete memoryCache[k];
          count++;
        }
      });
      logger.debug(`Cleared ${count} cache entries matching pattern: ${key}`);
    } else {
      delete memoryCache[key];
      logger.debug(`Cleared cache for key: ${key}`);
    }
  } else {
    const count = Object.keys(memoryCache).length;
    Object.keys(memoryCache).forEach((k) => {
      delete memoryCache[k];
    });
    logger.debug(`Cleared all ${count} cache entries`);
  }
};
