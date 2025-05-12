import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';

export interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    type?: string;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean;
    message?: string;
  };
}

export const validateBody = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: { [key: string]: string } = {};

    for (const field in schema) {
      const rules = schema[field];
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors[field] = rules.message || `${field} is required`;
        continue;
      }

      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (rules.type) {
        const valueType = typeof value;
        if (
          (rules.type === 'string' && valueType !== 'string') ||
          (rules.type === 'number' && valueType !== 'number') ||
          (rules.type === 'boolean' && valueType !== 'boolean') ||
          (rules.type === 'object' && valueType !== 'object') ||
          (rules.type === 'array' && !Array.isArray(value))
        ) {
          errors[field] = rules.message || `${field} must be a ${rules.type}`;
          continue;
        }
      }

      if (rules.minLength !== undefined && typeof value === 'string' && value.length < rules.minLength) {
        errors[field] = rules.message || `${field} must be at least ${rules.minLength} characters`;
        continue;
      }

      if (rules.maxLength !== undefined && typeof value === 'string' && value.length > rules.maxLength) {
        errors[field] = rules.message || `${field} must be at most ${rules.maxLength} characters`;
        continue;
      }

      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors[field] = rules.message || `${field} is invalid`;
        continue;
      }

      if (rules.custom && !rules.custom(value)) {
        errors[field] = rules.message || `${field} is invalid`;
        continue;
      }
    }

    if (Object.keys(errors).length > 0) {
      const error = new Error('Validation failed') as ApiError;
      error.statusCode = 400;
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors,
      });
      return;
    }

    next();
  };
};

export const authValidation = {
  register: {
    username: {
      required: true,
      type: 'string',
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_]+$/,
      message: 'Username must be 3-50 characters and can only contain letters, numbers, and underscores',
    },
    email: {
      required: true,
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please provide a valid email address',
    },
    password: {
      required: true,
      type: 'string',
      minLength: 8,
      message: 'Password must be at least 8 characters',
    },
    firstName: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 50,
      message: 'First name is required',
    },
    lastName: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 50,
      message: 'Last name is required',
    },
  },
  login: {
    username: {
      required: true,
      type: 'string',
      message: 'Username or email is required',
    },
    password: {
      required: true,
      type: 'string',
      message: 'Password is required',
    },
  },
  requestPasswordReset: {
    email: {
      required: true,
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please provide a valid email address',
    },
  },
  resetPassword: {
    password: {
      required: true,
      type: 'string',
      minLength: 8,
      message: 'Password must be at least 8 characters',
    },
  },
};