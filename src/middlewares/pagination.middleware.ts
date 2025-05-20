import { Request, Response, NextFunction } from 'express';

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

export interface PaginatedResponse<T> {
  status: string;
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  data: T[];
}

export const paginationMiddleware = (options: PaginationOptions = {}) => {
  const defaultLimit = options.defaultLimit || 10;
  const maxLimit = options.maxLimit || 100;

  return (req: Request, res: Response, next: NextFunction) => {
    let page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || defaultLimit;

    if (limit > maxLimit) {
      limit = maxLimit;
    }

    if (limit < 1) limit = 1;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;

    req.pagination = {
      page,
      limit,
      offset,
    };

    res.paginate = <T>(data: T[], totalItems: number): PaginatedResponse<T> => {
      const totalPages = Math.ceil(totalItems / limit);

      return {
        status: 'success',
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        data,
      };
    };

    next();
  };
};

declare global {
  namespace Express {
    interface Request {
      pagination: {
        page: number;
        limit: number;
        offset: number;
      };
    }
    interface Response {
      paginate<T>(data: T[], totalItems: number): PaginatedResponse<T>;
    }
  }
}
