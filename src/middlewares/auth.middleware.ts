import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/token.utils';
import { User } from '../models';
import { ApiError } from './errorHandler';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
        email: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      const error = new Error('Invalid or expired token') as ApiError;
      error.statusCode = 401;
      throw error;
    }
    
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      const error = new Error('User not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }
    
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

export const isVerified = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }
    
    const user = await User.findByPk(req.user.userId);
    
    if (!user || !user.isVerified) {
      const error = new Error('Account not verified') as ApiError;
      error.statusCode = 403;
      throw error;
    }
    
    next();
  } catch (error) {
    next(error);
  }
};